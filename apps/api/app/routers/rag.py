from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.core.auth import CurrentUser, require_role
from app.core.config import Settings, get_settings
from app.models import RagDocumentIn, RagSearchIn
from app.services.mock_store import store
from app.services.openai_adapter import get_openai_adapter

router = APIRouter(prefix="/v1/foundation/rag", tags=["foundation-rag"])


@router.post("/documents")
async def register_rag_document(
    document: RagDocumentIn,
    request: Request,
    user: CurrentUser = Depends(require_role("curriculum_researcher", "admin")),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    adapter = get_openai_adapter(settings)
    embedding = await adapter.embed_text(document.text)
    agent_run = store.record_agent_run(
        user_id=user.user_id,
        workflow_type="rag_ingestion",
        payload_ref=f"mock://rag/{document.title}",
        status_value="SUCCEEDED",
        model_id=settings.openai_embedding_model if settings.openai_api_key else "mock-openai-adapter",
        trace_id=request.state.trace_id,
    )
    tool_call = store.record_tool_call(
        agent_run_id=agent_run["agentRunId"],
        tool_name="embedding_generator",
        input_ref=f"mock://rag/{document.title}/text",
        output_ref=f"mock://rag/{document.title}/embedding",
        status_value="SUCCEEDED",
    )
    queue_job = store.record_queue_job(
        workflow_type="rag_ingestion",
        payload_ref=f"mock://rag/{document.title}",
        trace_id=request.state.trace_id,
        status_value="SUCCEEDED",
    )
    result = store.register_rag_document(
        source_type=document.sourceType,
        title=document.title,
        text=document.text,
        embedding=embedding,
    )
    store.record_trace_event(
        trace_id=request.state.trace_id,
        event_type="rag_document.ingest",
        object_ref=f"RagDocument:{result['documentId']}",
    )
    store.record_audit_log(
        actor_user_id=user.user_id,
        action="rag_document.ingest",
        object_type="RagDocument",
        object_id=result["documentId"],
        request_id=request.state.request_id,
        trace_id=request.state.trace_id,
        job_id=queue_job["queueJobId"],
        initiated_by="foundation_rag_api",
    )
    return result | {
        "agentRunId": agent_run["agentRunId"],
        "toolCallId": tool_call["toolCallId"],
        "queueJobId": queue_job["queueJobId"],
        "traceId": request.state.trace_id,
        "requestId": request.state.request_id,
    }


@router.post("/search")
async def search_rag(
    search: RagSearchIn,
    request: Request,
    user: CurrentUser = Depends(require_role("teacher", "curriculum_researcher", "expert", "admin")),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    adapter = get_openai_adapter(settings)
    embedding = await adapter.embed_text(search.query)
    agent_run = store.record_agent_run(
        user_id=user.user_id,
        workflow_type="rag_search",
        payload_ref=f"mock://rag/search/{search.query[:40]}",
        status_value="SUCCEEDED",
        model_id=settings.openai_embedding_model if settings.openai_api_key else "mock-openai-adapter",
        trace_id=request.state.trace_id,
    )
    tool_call = store.record_tool_call(
        agent_run_id=agent_run["agentRunId"],
        tool_name="rag_search",
        input_ref="mock://rag/search/query",
        output_ref="mock://rag/search/results",
        status_value="SUCCEEDED",
    )
    return store.rag_search(query_embedding=embedding, source_types=search.sourceTypes, top_k=search.topK) | {
        "agentRunId": agent_run["agentRunId"],
        "toolCallId": tool_call["toolCallId"],
        "traceId": request.state.trace_id,
        "requestId": request.state.request_id,
    }
