from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.auth import CurrentUser, get_current_user
from app.core.config import Settings, get_settings
from app.models import AgentRunIn
from app.services.mock_store import store

router = APIRouter(prefix="/v1/foundation/agent", tags=["foundation-agent"])

WORKFLOW_ROLE_SCOPE: dict[str, set[str]] = {
    "recommend_path": {"teacher", "admin"},
    "path_verifier": {"teacher", "admin"},
    "grade_objective_task": {"student", "teacher", "admin"},
    "transcribe_speaking": {"student", "teacher", "admin"},
    "feedback_speaking": {"student", "teacher", "admin"},
    "generate_similar_practice": {"student", "teacher", "admin"},
    "content_annotation": {"curriculum_researcher", "expert", "admin"},
    "diagnosis_summarizer": {"teacher", "admin"},
    "review_case_triage": {"teacher", "curriculum_researcher", "expert", "admin"},
    "research_evidence": {"curriculum_researcher", "expert", "admin"},
    "rag_answer_teacher": {"teacher", "curriculum_researcher", "expert", "admin"},
    "lms_sync": {"teacher", "admin"},
}


@router.post("/runs")
async def create_agent_run(
    run: AgentRunIn,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    allowed_roles = WORKFLOW_ROLE_SCOPE.get(run.workflowType)
    if allowed_roles is None or user.role not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Workflow is not allowed for this role")
    agent_run = store.record_agent_run(
        user_id=user.user_id,
        workflow_type=run.workflowType,
        payload_ref=f"mock://agent/{run.workflowType}",
        status_value="QUEUED",
        model_id=settings.openai_agent_model if settings.openai_api_key else "mock-openai-adapter",
        trace_id=request.state.trace_id,
    )
    queue_job = store.record_queue_job(
        workflow_type=run.workflowType,
        payload_ref=f"mock://agent/{run.workflowType}",
        trace_id=request.state.trace_id,
        status_value="QUEUED",
    )
    store.record_audit_log(
        actor_user_id=user.user_id,
        action="agent_run.create",
        object_type="AgentRun",
        object_id=agent_run["agentRunId"],
        request_id=request.state.request_id,
        trace_id=request.state.trace_id,
        job_id=queue_job["queueJobId"],
        initiated_by="foundation_agent_api",
    )
    return agent_run | {
        "queueJobId": queue_job["queueJobId"],
        "requestId": request.state.request_id,
        "audit": "Every external tool call must be recorded in tool_calls before completion.",
    }
