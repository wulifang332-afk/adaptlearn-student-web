from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import CurrentUser, require_staff

router = APIRouter(prefix="/v1/admin/review-cases", tags=["admin-review"])


@router.get("")
async def list_review_cases(user: CurrentUser = Depends(require_staff)) -> dict[str, object]:
    return {
        "items": [],
        "scope": {"role": user.role, "classIds": user.class_ids},
        "note": "ReviewCase details are staff-only and never returned to student endpoints.",
    }


@router.patch("/{review_case_id}")
async def update_review_case(review_case_id: str, user: CurrentUser = Depends(require_staff)) -> dict[str, object]:
    return {
        "reviewCaseId": review_case_id,
        "status": "NOT_IMPLEMENTED_IN_SKELETON",
        "actorUserId": user.user_id,
        "requiresDecisionTrace": True,
    }
