from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.auth import CurrentUser, get_current_user
from app.models import MediaSignRequest
from app.services.mock_store import store

router = APIRouter(prefix="/v1/media", tags=["media"])


@router.post("/uploads/sign")
async def sign_media_upload(
    request: MediaSignRequest,
    raw_request: Request,
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    if user.role == "student" and request.bucket != "student-media":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Students can sign only student-media uploads")
    if request.bucket == "rag-source-docs" and user.role not in {"curriculum_researcher", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="RAG source documents are staff-scoped")
    object_path = request.objectPath
    if request.bucket == "student-media" and user.role == "student" and not object_path.startswith(f"{user.user_id}/"):
        object_path = f"{user.user_id}/{object_path.lstrip('/')}"
    upload = store.create_media_upload(
        bucket=request.bucket,
        object_path=object_path,
        content_type=request.contentType,
        operation=request.operation,
    )
    store.record_trace_event(
        trace_id=raw_request.state.trace_id,
        event_type="media_signed_url.create",
        object_ref=f"{request.bucket}/{object_path}",
    )
    store.record_audit_log(
        actor_user_id=user.user_id,
        action="media_signed_url.create",
        object_type="MediaUpload",
        object_id=upload["mediaUploadId"],
        request_id=raw_request.state.request_id,
        trace_id=raw_request.state.trace_id,
        job_id=None,
        initiated_by="media_api",
    )
    return upload | {"traceId": raw_request.state.trace_id, "requestId": raw_request.state.request_id}
