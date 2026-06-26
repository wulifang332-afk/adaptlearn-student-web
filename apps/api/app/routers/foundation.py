from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.core.auth import CurrentUser, require_role
from app.core.config import Settings, get_settings
from app.services.foundation_store import (
    environment_checks,
    foundation_overview,
    foundation_registries,
    generator_dry_run_preview,
    get_foundation_page,
    get_foundation_registry,
    list_foundation_pages,
    rls_test_results,
    student_safe_preview,
)
from app.services.mock_store import store

router = APIRouter(prefix="/v1/foundation", tags=["foundation"])


def require_foundation_admin(user: CurrentUser = Depends(require_role("admin"))) -> CurrentUser:
    return user


@router.get("/overview")
async def overview(
    request: Request,
    user: CurrentUser = Depends(require_foundation_admin),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    audit = _record_read_audit(request, user, action="foundation.overview.read", object_type="Foundation", object_id="overview")
    return foundation_overview(settings) | _meta(request, audit["auditLogId"])


@router.get("/pages")
async def pages(request: Request, user: CurrentUser = Depends(require_foundation_admin)) -> dict[str, object]:
    audit = _record_read_audit(request, user, action="foundation.pages.read", object_type="FoundationPage", object_id="all")
    return {"mock": True, "pages": list_foundation_pages()} | _meta(request, audit["auditLogId"])


@router.get("/pages/{page_id}")
async def page_detail(
    page_id: str,
    request: Request,
    user: CurrentUser = Depends(require_foundation_admin),
) -> dict[str, object]:
    audit = _record_read_audit(
        request,
        user,
        action="foundation.page.read",
        object_type="FoundationPage",
        object_id=page_id,
    )
    return get_foundation_page(page_id) | _meta(request, audit["auditLogId"])


@router.get("/environment/checks")
async def get_environment_checks(
    request: Request,
    user: CurrentUser = Depends(require_foundation_admin),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    audit = _record_read_audit(
        request,
        user,
        action="foundation.environment.check",
        object_type="EnvironmentChecks",
        object_id="mock-readiness",
    )
    return environment_checks(settings) | _meta(request, audit["auditLogId"])


@router.get("/registries")
async def registries(
    request: Request,
    user: CurrentUser = Depends(require_foundation_admin),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    audit = _record_read_audit(
        request,
        user,
        action="foundation.registries.read",
        object_type="FoundationRegistry",
        object_id="all",
    )
    return foundation_registries(settings) | _meta(request, audit["auditLogId"])


@router.get("/registries/{registry_id}")
async def registry_detail(
    registry_id: str,
    request: Request,
    user: CurrentUser = Depends(require_foundation_admin),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    audit = _record_read_audit(
        request,
        user,
        action="foundation.registry.read",
        object_type="FoundationRegistry",
        object_id=registry_id,
    )
    return get_foundation_registry(registry_id, settings) | _meta(request, audit["auditLogId"])


@router.get("/rls/tests")
async def get_rls_tests(request: Request, user: CurrentUser = Depends(require_foundation_admin)) -> dict[str, object]:
    audit = _record_read_audit(
        request,
        user,
        action="foundation.rls.test_run",
        object_type="RlsTestRun",
        object_id="mock-rls-run",
    )
    return rls_test_results() | _meta(request, audit["auditLogId"])


@router.get("/student-safe-preview")
async def get_student_safe_preview(
    request: Request,
    user: CurrentUser = Depends(require_foundation_admin),
) -> dict[str, object]:
    audit = _record_read_audit(
        request,
        user,
        action="foundation.student_safe_preview.read",
        object_type="StudentSafeProjection",
        object_id="mock-preview",
    )
    return student_safe_preview() | _meta(request, audit["auditLogId"])


@router.get("/generator/dry-run")
async def get_generator_dry_run(
    request: Request,
    user: CurrentUser = Depends(require_foundation_admin),
) -> dict[str, object]:
    audit = _record_read_audit(
        request,
        user,
        action="foundation.generator.dry_run",
        object_type="GeneratedCrudSpec",
        object_id="dryrun_generated_crud_mock_001",
    )
    return generator_dry_run_preview() | _meta(request, audit["auditLogId"])


def _record_read_audit(request: Request, user: CurrentUser, *, action: str, object_type: str, object_id: str) -> dict[str, object]:
    store.record_trace_event(trace_id=request.state.trace_id, event_type=action, object_ref=f"{object_type}:{object_id}")
    return store.record_audit_log(
        actor_user_id=user.user_id,
        action=action,
        object_type=object_type,
        object_id=object_id,
        request_id=request.state.request_id,
        trace_id=request.state.trace_id,
        job_id=None,
        initiated_by="foundation_readiness_api",
    )


def _meta(request: Request, audit_log_id: str) -> dict[str, object]:
    return {
        "traceId": request.state.trace_id,
        "requestId": request.state.request_id,
        "auditLogId": audit_log_id,
    }
