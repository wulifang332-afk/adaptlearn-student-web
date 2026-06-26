from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import CurrentUser, require_role, require_staff
from app.models import AdminPathDecisionIn
from app.services.admin_store import admin_store

router = APIRouter(prefix="/v1/admin", tags=["admin"])


@router.get("/me")
async def admin_me(user: CurrentUser = Depends(require_staff)) -> dict[str, object]:
    return {"userId": user.user_id, "role": user.role, "displayName": user.display_name, "scope": admin_store.scope(user)}


@router.get("/dashboard")
async def admin_dashboard(user: CurrentUser = Depends(require_staff)) -> dict[str, object]:
    return admin_store.dashboard(user)


@router.get("/content")
async def admin_content(user: CurrentUser = Depends(require_role("teacher", "curriculum_researcher"))) -> dict[str, object]:
    return {"items": admin_store.content_rows(), "role": user.role}


@router.get("/taxonomy/tree")
async def admin_taxonomy(user: CurrentUser = Depends(require_role("teacher", "curriculum_researcher", "expert"))) -> dict[str, object]:
    return {"items": admin_store.taxonomy_rows(), "role": user.role}


@router.get("/annotations")
async def admin_annotations(user: CurrentUser = Depends(require_role("curriculum_researcher", "expert"))) -> dict[str, object]:
    return {"items": admin_store.annotation_rows(), "role": user.role}


@router.get("/packages")
async def admin_packages(user: CurrentUser = Depends(require_role("teacher", "curriculum_researcher"))) -> dict[str, object]:
    return {"items": admin_store.package_rows(), "role": user.role}


@router.get("/classes/{class_id}/diagnosis")
async def admin_class_diagnosis(class_id: str, user: CurrentUser = Depends(require_role("teacher"))) -> dict[str, object]:
    if class_id not in user.class_ids:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher is not assigned to this class")
    return {"items": admin_store.diagnosis_rows(), "classId": class_id}


@router.get("/paths/{path_id}/review")
async def admin_path_review(path_id: str, user: CurrentUser = Depends(require_role("teacher"))) -> dict[str, object]:
    return admin_store.path_review(path_id, user)


@router.post("/paths/{path_id}/decision")
async def admin_path_decision(
    path_id: str,
    decision: AdminPathDecisionIn,
    user: CurrentUser = Depends(require_role("teacher")),
) -> dict[str, object]:
    return admin_store.record_path_decision(
        path_id=path_id,
        path_version=decision.pathVersion,
        action=decision.action,
        reason=decision.reason,
        user=user,
    )


@router.get("/review-cases")
async def admin_review_cases(user: CurrentUser = Depends(require_staff)) -> dict[str, object]:
    return admin_store.review_cases() | {"scope": admin_store.scope(user)}


@router.patch("/review-cases/{review_case_id}")
async def admin_update_review_case(review_case_id: str, user: CurrentUser = Depends(require_staff)) -> dict[str, object]:
    return {
        "reviewCaseId": review_case_id,
        "status": "NOT_IMPLEMENTED_IN_SKELETON",
        "actorUserId": user.user_id,
        "requiresDecisionTrace": True,
    }


@router.get("/rules/profiles")
async def admin_rule_profiles(user: CurrentUser = Depends(require_role("teacher", "curriculum_researcher", "admin"))) -> dict[str, object]:
    return {"items": admin_store.rule_rows(), "role": user.role}


@router.get("/research/claims")
async def admin_research_claims(user: CurrentUser = Depends(require_role("curriculum_researcher", "expert"))) -> dict[str, object]:
    return {"items": admin_store.research_rows(), "role": user.role}


@router.get("/monitoring/summary")
async def admin_monitoring(user: CurrentUser = Depends(require_role("admin", "curriculum_researcher"))) -> dict[str, object]:
    return {"items": admin_store.monitoring_rows(), "role": user.role}
