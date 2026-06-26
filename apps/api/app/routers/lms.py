from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.core.auth import CurrentUser, require_role
from app.core.config import Settings, get_settings
from app.models import LmsSyncIn
from app.services.lms import get_lms_adapter
from app.services.mock_store import store

router = APIRouter(prefix="/v1/foundation/lms", tags=["foundation-lms"])


@router.post("/sync")
async def sync_lms(
    sync: LmsSyncIn,
    request: Request,
    user: CurrentUser = Depends(require_role("teacher", "admin")),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    adapter = get_lms_adapter(settings)
    result = await adapter.sync_object(sync.objectType, sync.objectId, sync.direction, trace_id=request.state.trace_id)
    queue_job = store.record_queue_job(
        workflow_type="lms_sync",
        payload_ref=f"mock://lms/{sync.objectType}/{sync.objectId}",
        trace_id=request.state.trace_id,
        status_value="SUCCEEDED",
    )
    store.record_audit_log(
        actor_user_id=user.user_id,
        action="lms_sync.trigger",
        object_type=sync.objectType,
        object_id=sync.objectId,
        request_id=request.state.request_id,
        trace_id=request.state.trace_id,
        job_id=queue_job["queueJobId"],
        initiated_by="foundation_lms_api",
    )
    return result | {
        "initiatedBy": user.user_id,
        "adapter": "MockLmsAdapter",
        "queueJobId": queue_job["queueJobId"],
        "requestId": request.state.request_id,
    }
