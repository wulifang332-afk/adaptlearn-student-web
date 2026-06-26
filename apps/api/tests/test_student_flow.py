from fastapi.testclient import TestClient

from app.main import app
from app.services.mock_store import store


client = TestClient(app)


def setup_function() -> None:
    store.reset()


def test_home_to_task1_submit_unlocks_task2() -> None:
    home = client.get("/v1/student/home").json()
    assert home["student"]["displayName"] == "Xiaoming Zhang"
    assert home["recommendedTask"]["taskId"] == "UI01"
    assert home["activePath"]["completedCount"] == 0

    task = client.get("/v1/student/tasks/UI01").json()["task"]
    assert task["title"] == "Label the parts of a plant"

    submission = client.post(
        "/v1/student/tasks/UI01/submissions",
        json={
            "learnerId": "stu_persona_a",
            "taskId": "UI01",
            "pathId": "PTH01",
            "pathVersion": 1,
            "idempotencyKey": "test-ui01-submit",
            "response": {"labels": {"root": "root", "stem": "stem", "leaf": "leaf", "seed": "seed"}},
        },
    ).json()
    assert submission["status"] == "COMPLETED"
    assert submission["feedback"]["summary"] == "4 of 4 correct"
    assert submission["nextTaskId"] == "UI02"
    assert submission["agentRunId"].startswith("agent_run_")
    assert submission["projection"] == "student_feedback_view"
    assert submission["toolCallId"].startswith("tool_call_")
    assert submission["traceId"].startswith("trc_")

    path = client.get("/v1/student/path/PTH01").json()
    statuses = {task["taskId"]: task["status"] for task in path["taskCards"]}
    assert statuses["UI01"] == "COMPLETED"
    assert statuses["UI02"] == "AVAILABLE"

    task2 = client.get("/v1/student/tasks/UI02").json()["task"]
    assert task2["isActionable"] is True


def test_submission_is_idempotent() -> None:
    payload = {
        "learnerId": "stu_persona_a",
        "taskId": "UI01",
        "pathId": "PTH01",
        "pathVersion": 1,
        "idempotencyKey": "same-submit-key",
        "response": {"labels": {"root": "root"}},
    }
    first = client.post("/v1/student/tasks/UI01/submissions", json=payload).json()
    second = client.post("/v1/student/tasks/UI01/submissions", json=payload).json()
    assert first["submissionId"] == second["submissionId"]


def test_task4_penalizes_wrong_selection() -> None:
    client.post(
        "/v1/student/tasks/UI01/submissions",
        json={
            "learnerId": "stu_persona_a",
            "taskId": "UI01",
            "pathId": "PTH01",
            "pathVersion": 1,
            "idempotencyKey": "unlock-ui02",
            "response": {"labels": {"root": "root", "stem": "stem", "leaf": "leaf", "seed": "seed"}},
        },
    )
    client.post(
        "/v1/student/tasks/UI02/submissions",
        json={
            "learnerId": "stu_persona_a",
            "taskId": "UI02",
            "pathId": "PTH01",
            "pathVersion": 1,
            "idempotencyKey": "unlock-ui03",
            "response": {"classification": {}},
        },
    )
    client.post(
        "/v1/student/tasks/UI03/submissions",
        json={
            "learnerId": "stu_persona_a",
            "taskId": "UI03",
            "pathId": "PTH01",
            "pathVersion": 1,
            "idempotencyKey": "unlock-ui08",
            "response": {"order": []},
        },
    )
    submission = client.post(
        "/v1/student/tasks/UI08/submissions",
        json={
            "learnerId": "stu_persona_a",
            "taskId": "UI08",
            "pathId": "PTH01",
            "pathVersion": 1,
            "idempotencyKey": "task4-wrong-option",
            "response": {"selected": ["glucose", "oxygen", "growth", "water"]},
        },
    ).json()
    assert submission["feedback"]["summary"] == "2 of 3 correct"


def test_staff_only_rag_ingestion_and_mock_lms_sync() -> None:
    denied = client.post(
        "/v1/foundation/rag/documents",
        json={"sourceType": "teacher_rules", "title": "Rule doc", "text": "Use safe formative feedback."},
    )
    assert denied.status_code == 403

    ok = client.post(
        "/v1/foundation/rag/documents",
        headers={"x-mock-role": "curriculum_researcher"},
        json={"sourceType": "teacher_rules", "title": "Rule doc", "text": "Use safe formative feedback."},
    )
    assert ok.status_code == 200
    assert ok.json()["chunkCount"] == 1
    assert ok.json()["toolCallId"].startswith("tool_call_")

    sync = client.post(
        "/v1/foundation/lms/sync",
        headers={"x-mock-role": "teacher"},
        json={
            "objectType": "LearningPath",
            "objectId": "PTH01",
            "direction": "outbound",
            "idempotencyKey": "lms-sync-pth01",
        },
    ).json()
    assert sync["adapter"] == "MockLmsAdapter"
    assert sync["status"] == "SYNCED"
    assert sync["queueJobId"].startswith("queue_job_")
