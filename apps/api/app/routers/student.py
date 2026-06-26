from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.auth import CurrentUser, get_current_user, require_student
from app.models import SubmissionIn
from app.services.mock_store import store

router = APIRouter(prefix="/v1", tags=["student"])


@router.get("/me")
async def me(user: CurrentUser = Depends(get_current_user)) -> dict[str, object]:
    return {
        "userId": user.user_id,
        "role": user.role,
        "displayName": user.display_name,
        "organizationId": user.organization_id,
        "classIds": user.class_ids,
        "studentId": user.student_id,
        "mockAuth": True,
    }


@router.get("/student/home")
async def student_home(user: CurrentUser = Depends(require_student)) -> dict[str, object]:
    return store.get_home(user.student_id or "")


@router.get("/student/path/{path_id}")
async def student_path(path_id: str, user: CurrentUser = Depends(require_student)) -> dict[str, object]:
    return store.get_path(user.student_id or "", path_id)


@router.get("/student/tasks/{task_id}")
async def student_task(task_id: str, user: CurrentUser = Depends(require_student)) -> dict[str, object]:
    return store.get_task(user.student_id or "", task_id)


@router.post("/student/tasks/{task_id}/submissions")
async def submit_student_task(
    task_id: str,
    submission: SubmissionIn,
    request: Request,
    user: CurrentUser = Depends(require_student),
) -> dict[str, object]:
    if submission.learnerId != user.student_id or submission.taskId != task_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submission learnerId/taskId must match the authenticated student and route task.",
        )
    return store.submit_task(
        student_id=user.student_id or "",
        task_id=task_id,
        path_id=submission.pathId,
        path_version=submission.pathVersion,
        response=submission.response,
        idempotency_key=submission.idempotencyKey,
        actor_user_id=user.user_id,
        request_id=request.state.request_id,
        trace_id=request.state.trace_id,
    )


@router.post("/student/tasks/{task_id}/similar")
async def start_similar_practice(task_id: str, user: CurrentUser = Depends(require_student)) -> dict[str, object]:
    return store.start_similar(user.student_id or "", task_id, user.user_id)


@router.get("/student/progress")
async def student_progress(user: CurrentUser = Depends(require_student)) -> dict[str, object]:
    return store.get_progress(user.student_id or "")


@router.get("/student/profile")
async def student_profile(user: CurrentUser = Depends(require_student)) -> dict[str, object]:
    return store.get_profile(user.student_id or "")
