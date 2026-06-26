from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_admin_dashboard_is_staff_scoped_and_returns_business_governance_data() -> None:
    denied = client.get("/v1/admin/dashboard")
    assert denied.status_code == 403

    response = client.get("/v1/admin/dashboard", headers={"x-mock-role": "teacher"})
    assert response.status_code == 200
    body = response.json()

    assert body["mock"] is True
    assert body["scope"]["role"] == "teacher"
    assert body["scope"]["classId"] == "class_g7_a"
    assert any(metric["label"] == "Path reviews" for metric in body["metrics"])
    assert body["publishGuard"]["allowed"] is False
    assert body["publishGuard"]["code"] == "BLOCKING_REVIEW_CASE"
    assert body["safeProjectionPreview"]["status"] == "REVIEW_PENDING"


def test_path_review_requires_teacher_class_scope_and_blocks_publish() -> None:
    denied = client.get("/v1/admin/paths/pth_xiaoming_u6_v3/review", headers={"x-mock-role": "curriculum_researcher"})
    assert denied.status_code == 403

    response = client.get("/v1/admin/paths/pth_xiaoming_u6_v3/review", headers={"x-mock-role": "teacher"})
    assert response.status_code == 200
    body = response.json()

    assert body["scope"]["role"] == "teacher"
    assert body["scope"]["classId"] == "class_g7_a"
    assert body["path"]["learnerLabel"] == "Xiaoming Zhang"
    assert body["path"]["classId"] == "class_g7_a"
    assert body["publishGuard"]["code"] == "BLOCKING_REVIEW_CASE"
    assert any(case["severity"] == "BLOCK" for case in body["reviewCases"])


def test_teacher_decision_requires_reason_for_replan_and_returns_decision_trace() -> None:
    missing_reason = client.post(
        "/v1/admin/paths/pth_xiaoming_u6_v3/decision",
        headers={"x-mock-role": "teacher"},
        json={"pathVersion": 3, "action": "REPLAN"},
    )
    assert missing_reason.status_code == 400

    response = client.post(
        "/v1/admin/paths/pth_xiaoming_u6_v3/decision",
        headers={"x-mock-role": "teacher"},
        json={
            "pathVersion": 3,
            "action": "REPLAN",
            "reason": "Retell after vocabulary evidence is confirmed.",
        },
    )
    assert response.status_code == 200
    body = response.json()

    assert body["decision_trace_id"].startswith("dtr_")
    assert body["decisionTrace"]["reason_required"] is True
    assert body["decisionTrace"]["reason_text"] == "Retell after vocabulary evidence is confirmed."
