import json

from fastapi.testclient import TestClient

from app.main import app
from app.services.foundation_store import FORBIDDEN_STUDENT_FIELD_TOKENS
from app.services.mock_store import store


client = TestClient(app)


def setup_function() -> None:
    store.reset()


def test_foundation_overview_is_admin_scoped_and_lists_pages() -> None:
    denied = client.get("/v1/foundation/overview")
    assert denied.status_code == 403

    response = client.get("/v1/foundation/overview", headers={"x-mock-role": "admin"})
    assert response.status_code == 200
    body = response.json()

    assert body["mock"] is True
    assert body["surface"] == "Foundational Console"
    assert body["routeRoot"] == "/foundation"
    assert body["pageCount"] == 16
    assert body["traceId"].startswith("trc_")
    assert body["auditLogId"].startswith("audit_log_")
    assert "No service-role secret in browser." in body["boundaries"]


def test_foundation_page_detail_and_environment_checks_return_safe_status_only() -> None:
    page = client.get("/v1/foundation/pages/rls", headers={"x-mock-role": "admin"}).json()
    assert page["label"] == "RLS Policy Viewer / Test Runner"
    assert page["mock"] is True
    assert "Foundation cannot bypass teacher/expert decisions." in page["boundaryRules"]

    checks = client.get("/v1/foundation/environment/checks", headers={"x-mock-role": "admin"}).json()
    assert checks["secretValuesReturned"] is False
    assert checks["browserServiceRoleExposure"] == "PASS"
    assert all(item["valueReturned"] is False for item in checks["checks"])
    assert any(item["name"] == "SUPABASE_SECRET_KEY" and item["serverOnly"] for item in checks["checks"])
    assert "SUPABASE_SECRET_KEY=" not in json.dumps(checks)


def test_foundation_rls_tests_cover_roles_without_raw_payloads() -> None:
    body = client.get("/v1/foundation/rls/tests", headers={"x-mock-role": "admin"}).json()
    roles = {item["actorRole"] for item in body["tests"]}

    assert {"student", "teacher", "curriculum_researcher", "expert", "admin", "browser", "service_job"} <= roles
    assert body["safeDiagnosticsOnly"] is True
    assert all(item["rawPayloadReturned"] is False for item in body["tests"])
    assert any(item["actorRole"] == "browser" and item["allowed"] is False for item in body["tests"])


def test_foundation_registries_are_admin_scoped_and_safe() -> None:
    denied = client.get("/v1/foundation/registries")
    assert denied.status_code == 403

    response = client.get("/v1/foundation/registries", headers={"x-mock-role": "admin"})
    assert response.status_code == 200
    body = response.json()
    body_text = json.dumps(body)

    assert body["secretValuesReturned"] is False
    assert body["rawStudentDataReturned"] is False
    assert body["summary"]["sectionCount"] >= 10
    assert body["summary"]["resourceCount"] >= 20
    assert any(section["registryId"] == "storage" for section in body["sections"])
    assert any(section["registryId"] == "lms" for section in body["sections"])
    assert all(resource["mock"] is True for section in body["sections"] for resource in section["resources"])
    assert "REDIS_URL=" not in body_text
    assert "OPENAI_API_KEY=" not in body_text
    assert "SUPABASE_SECRET_KEY=" not in body_text
    assert body["traceId"].startswith("trc_")
    assert body["auditLogId"].startswith("audit_log_")

    lms = client.get("/v1/foundation/registries/lms", headers={"x-mock-role": "admin"}).json()
    assert lms["registryId"] == "lms"
    assert lms["secretValuesReturned"] is False
    assert lms["rawStudentDataReturned"] is False


def test_student_safe_preview_excludes_forbidden_fields_from_safe_output() -> None:
    body = client.get("/v1/foundation/student-safe-preview", headers={"x-mock-role": "admin"}).json()
    safe_output_text = json.dumps(body["safeOutput"])

    for token in FORBIDDEN_STUDENT_FIELD_TOKENS:
        assert token not in safe_output_text

    assert body["projection"] == "student_learning_path_view"
    assert "blockedFieldTokens" in body
    assert body["safeOutput"]["safe_status"] == "deliverable"


def test_generator_dry_run_is_admin_scoped_review_gated_and_read_only() -> None:
    denied = client.get("/v1/foundation/generator/dry-run")
    assert denied.status_code == 403

    response = client.get("/v1/foundation/generator/dry-run", headers={"x-mock-role": "admin"})
    assert response.status_code == 200
    body = response.json()
    body_text = json.dumps(body)

    assert body["mode"] == "dry_run"
    assert body["writeApplied"] is False
    assert body["fileWritesApplied"] is False
    assert body["databaseWritesApplied"] is False
    assert body["requiresHumanReview"] is True
    assert body["guardrails"]["noSecretsInGeneratedCode"] is True
    assert body["guardrails"]["noStudentFacingAutogeneration"] is True
    assert body["summary"]["generatableCount"] == 3
    assert body["summary"]["blockedCount"] == 2
    assert any(item["candidateId"] == "blocked_student_component_generation" for item in body["candidates"])
    assert all(item["reviewRequired"] is True for item in body["candidates"])
    assert "SUPABASE_SECRET_KEY=" not in body_text
    assert body["traceId"].startswith("trc_")
    assert body["auditLogId"].startswith("audit_log_")
