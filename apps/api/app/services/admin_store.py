from __future__ import annotations

from copy import deepcopy
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, status

from app.core.auth import CurrentUser


UNRESOLVED_REVIEW_STATUSES = {"OPEN", "ASSIGNED", "IN_REVIEW", "NEEDS_FIX", "REOPENED", "BLOCKED_FINAL"}
REASON_REQUIRED_ACTIONS = {"MODIFY", "REJECT", "REPLAN"}


def _now_iso() -> str:
    return datetime.now(tz=UTC).isoformat().replace("+00:00", "Z")


def _decision_trace(
    *,
    actor_user_id: str,
    actor_label: str,
    action: str,
    object_id: str,
    before_snapshot_ref: str,
    after_snapshot_ref: str | None = None,
    reason: str | None = None,
) -> dict[str, Any]:
    reason_required = action in REASON_REQUIRED_ACTIONS
    clean_reason = (reason or "").strip()
    if reason_required and not clean_reason:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{action} requires a non-empty reason")
    trace_id = f"dtr_{object_id}_{action.lower()}_{uuid4().hex[:10]}"
    return {
        "trace_id": trace_id,
        "actor_user_id": actor_user_id,
        "actor_label": actor_label,
        "action": action,
        "reason_required": reason_required,
        "reason_text": clean_reason or None,
        "before_snapshot_ref": before_snapshot_ref,
        "after_snapshot_ref": after_snapshot_ref,
        "rule_version": "rules-u6-teacher-default-v4",
        "lint_version": "path-lint-2026.06",
        "verifier_version": "path-verifier-2026.06",
        "created_at": _now_iso(),
        "display_summary": f"{actor_label} recorded {action.lower()} for {object_id}.",
    }


TASKS = [
    {
        "taskId": "UI01",
        "title": "Label the parts of a plant",
        "module": "Plant vocabulary",
        "taskType": "Word-picture matching",
        "minutes": 4,
        "bloom": "Remember",
        "thinking": "Observation",
        "nodeLabels": ["Root", "Stem", "Leaf", "Seed"],
        "taskState": "APPROVED",
        "annotationState": "APPROVED",
        "studentReason": "Practice a needed Unit 6 skill",
    },
    {
        "taskId": "UI02",
        "title": "Classify photosynthesis inputs and outputs",
        "module": "Photosynthesis",
        "taskType": "Classification",
        "minutes": 5,
        "bloom": "Understand",
        "thinking": "Compare",
        "nodeLabels": ["Sunlight", "Water", "Carbon dioxide", "Oxygen"],
        "taskState": "APPROVED",
        "annotationState": "APPROVED",
        "studentReason": "Practice a needed Unit 6 skill",
    },
    {
        "taskId": "UI03",
        "title": "Build the photosynthesis process",
        "module": "Photosynthesis",
        "taskType": "Process sequencing",
        "minutes": 6,
        "bloom": "Analyze",
        "thinking": "Sequence",
        "nodeLabels": ["Photosynthesis sequence", "Glucose", "Oxygen"],
        "taskState": "APPROVED",
        "annotationState": "APPROVED",
        "studentReason": "Practice a needed Unit 6 skill",
    },
    {
        "taskId": "UI08",
        "title": "Explain the effect of missing sunlight",
        "module": "Photosynthesis",
        "taskType": "Cause/effect multiple choice",
        "minutes": 5,
        "bloom": "Analyze",
        "thinking": "Cause and effect",
        "nodeLabels": ["Sunlight", "Glucose", "Plant growth"],
        "taskState": "APPROVED",
        "annotationState": "APPROVED",
        "studentReason": "Practice a needed Unit 6 skill",
    },
    {
        "taskId": "UI04",
        "title": "Choose the strongest plant explanation",
        "module": "Scientific explanation",
        "taskType": "Explanation evaluation",
        "minutes": 7,
        "bloom": "Evaluate",
        "thinking": "Evidence reasoning",
        "nodeLabels": ["Scientific explanation", "Evidence selection"],
        "taskState": "APPROVED",
        "annotationState": "APPROVED",
        "studentReason": "Practice a needed Unit 6 skill",
    },
    {
        "taskId": "UI17",
        "title": "Oral retelling of photosynthesis",
        "module": "Speaking",
        "taskType": "Oral retelling",
        "minutes": 8,
        "bloom": "Apply",
        "thinking": "Retell with evidence",
        "nodeLabels": ["Oral retelling", "Process explanation"],
        "taskState": "APPROVED",
        "annotationState": "BLOCKED",
        "studentReason": "Speak with evidence after teacher review",
    },
]

REVIEW_CASES = [
    {
        "review_case_id": "rc_path_sunlight_review",
        "object_type": "LearningPath",
        "object_id": "pth_xiaoming_u6_v3",
        "object_label": "Xiaoming Zhang - Unit 6 plant process path",
        "queue_label": "Learning path blocked before publication",
        "severity": "REVIEW",
        "risk_level": "MEDIUM",
        "owner_user_id": "mock_teacher_001",
        "owner_label": "Ms. Chen",
        "deadline_at": "2026-06-27T09:00:00.000Z",
        "status": "IN_REVIEW",
        "reason_codes": ["PATH_LINT_REVIEW", "SPEAKING_TASK_REVIEW_REQUIRED"],
        "teacher_readable_reason": "Oral retelling feedback needs teacher confirmation before this path can be published.",
        "source_version": "path v3",
        "trace_link": "/foundation/audit/traces/trc_path_sunlight_review",
    },
    {
        "review_case_id": "rc_annotation_high_risk",
        "object_type": "TaskAnnotation",
        "object_id": "UI17:annotation",
        "object_label": "Oral retelling - evidence and speaking annotation",
        "queue_label": "High-risk annotation case",
        "severity": "BLOCK",
        "risk_level": "HIGH",
        "owner_user_id": "mock_expert_001",
        "owner_label": "Expert Reviewer",
        "deadline_at": "2026-06-27T16:00:00.000Z",
        "status": "ASSIGNED",
        "reason_codes": ["LOW_CONFIDENCE_SPEAKING_RUBRIC", "EXPERT_REVIEW_REQUIRED"],
        "teacher_readable_reason": "Speaking rubric alignment is blocked until the expert clears the annotation.",
        "source_version": "annotation candidate 2",
        "trace_link": "/foundation/audit/traces/trc_annotation_high_risk",
    },
    {
        "review_case_id": "rc_content_copyright",
        "object_type": "ContentVersion",
        "object_id": "cnt_u6_daylight_v2",
        "object_label": "Daylight and plant growth reading",
        "queue_label": "Content or copyright issue",
        "severity": "REVIEW",
        "risk_level": "MEDIUM",
        "owner_user_id": "mock_researcher_001",
        "owner_label": "Curriculum Researcher",
        "deadline_at": "2026-06-28T03:00:00.000Z",
        "status": "NEEDS_FIX",
        "reason_codes": ["MISSING_SOURCE_PAGE", "COPYRIGHT_STATUS_UNKNOWN"],
        "teacher_readable_reason": "Source page and copyright status must be fixed before publication.",
        "source_version": "content v2",
    },
    {
        "review_case_id": "rc_lms_dead_letter",
        "object_type": "LmsSync",
        "object_id": "sync_u6_path_publish_42",
        "object_label": "LMS publish for Grade 7 English A",
        "queue_label": "Sync failure and compensation",
        "severity": "REVIEW",
        "risk_level": "LOW",
        "owner_user_id": "mock_admin_001",
        "owner_label": "System Admin",
        "deadline_at": "2026-06-26T14:00:00.000Z",
        "status": "OPEN",
        "reason_codes": ["LMS_DEAD_LETTER", "RETRY_EXHAUSTED"],
        "teacher_readable_reason": "AdaptLearn path remains governed; LMS publish needs retry or compensation.",
        "source_version": "sync attempt 5",
        "trace_link": "/foundation/audit/traces/trc_lms_dead_letter",
    },
]


def _path() -> dict[str, Any]:
    return {
        "pathId": "pth_xiaoming_u6_v3",
        "learnerId": "learner_xiaoming",
        "learnerLabel": "Xiaoming Zhang",
        "classId": "class_g7_a",
        "classLabel": "Grade 7 English A",
        "unitId": "U6",
        "unitTitle": "The Power of Plants",
        "goal": "Build vocabulary, process sequencing, and explanation quality for plant processes.",
        "status": "TEACHER_REVIEW",
        "version": 3,
        "currentVersion": 3,
        "lintStatus": "INFO",
        "verifierStatus": "PASS",
        "ruleVersion": "rules-u6-teacher-default-v4",
        "verifierVersion": "path-verifier-2026.06",
        "tasks": deepcopy(TASKS),
        "reviewCaseIds": ["rc_path_sunlight_review"],
        "teacherAuditExplanation": {
            "teacherText": "The path emphasizes photosynthesis inputs/outputs and delays oral retelling until vocabulary evidence is stronger.",
            "studentText": "You will review plant words, sort photosynthesis ideas, then explain how plants use sunlight.",
            "ruleRefs": ["repeat-vocabulary-before-speaking", "max-35-minutes-per-path"],
            "excludedTaskRefs": ["UI22", "UI31"],
        },
        "ruleEvaluation": {
            "selectedTaskIds": ["UI01", "UI02", "UI03", "UI08", "UI04", "UI17"],
            "excluded": [
                {"taskId": "UI22", "reasonCode": "TOO_DIFFICULT_FOR_CURRENT_EVIDENCE"},
                {"taskId": "UI31", "reasonCode": "REQUIRES_UNAPPROVED_ANNOTATION"},
            ],
            "componentScores": {"evidenceFit": 0.82, "difficultyFit": 0.74, "novelty": 0.61},
        },
        "lmsSyncId": "sync_u6_path_publish_42",
    }


DECISION_TRACES = [
    _decision_trace(
        actor_user_id="mock_teacher_001",
        actor_label="Ms. Chen",
        action="REPLAN",
        object_id="pth_xiaoming_u6_v2",
        before_snapshot_ref="snapshot://paths/pth_xiaoming_u6_v2",
        after_snapshot_ref="snapshot://paths/pth_xiaoming_u6_v3",
        reason="Speaking task should come after vocabulary review and teacher confirmation.",
    )
]

CONTENT_ROWS = [
    {
        "title": "The Power of Plants source packet",
        "module": "Unit 6 overview",
        "status": "PUBLISHED_LOCKED",
        "source": "Textbook packet, pages 42-47",
        "copyright": "Cleared for mock",
        "version": "v1",
        "href": "/admin/content/cnt_u6_packet_v1",
        "meta": "cnt_u6_packet_v1",
    },
    {
        "title": "Daylight and plant growth reading",
        "module": "Photosynthesis",
        "status": "PRE_LINT",
        "source": "RAG source request pending",
        "copyright": "Needs fix",
        "version": "v2",
        "href": "/admin/content/cnt_u6_daylight_v2",
        "meta": "cnt_u6_daylight_v2",
    },
]

TAXONOMY_ROWS = [
    {
        "name": "Plant structure vocabulary",
        "path": "English knowledge / Vocabulary cluster",
        "level": "Skill cluster",
        "module": "Plant vocabulary",
        "tasks": 12,
        "risk": "Low",
        "status": "Version draft",
        "href": "/admin/taxonomy/node_plant_structure_vocabulary",
        "meta": "node_plant_structure_vocabulary",
    },
    {
        "name": "Photosynthesis inputs and outputs",
        "path": "English knowledge / Process understanding",
        "level": "Teachable node",
        "module": "Photosynthesis",
        "tasks": 18,
        "risk": "Medium",
        "status": "Version draft",
        "href": "/admin/taxonomy/node_photosynthesis_inputs_outputs",
        "meta": "node_photosynthesis_inputs_outputs",
    },
    {
        "name": "Oral retelling with evidence",
        "path": "Language skill / Speaking",
        "level": "Teachable node",
        "module": "Speaking",
        "tasks": 6,
        "risk": "High",
        "status": "Expert review requested",
        "href": "/admin/taxonomy/node_oral_retelling_evidence",
        "meta": "node_oral_retelling_evidence",
    },
]


def _work_queue_rows() -> list[dict[str, Any]]:
    return [
        {
            "queue": case["queue_label"],
            "item": case["object_label"],
            "severity": case["severity"],
            "status": case["status"],
            "owner": case.get("owner_label") or "Unassigned",
            "due": case.get("deadline_at", "No SLA"),
            "href": f"/admin/review-cases/{case['review_case_id']}",
            "meta": case["review_case_id"],
        }
        for case in REVIEW_CASES
    ]


def _blocking_cases_for_path() -> list[dict[str, Any]]:
    ids = {"pth_xiaoming_u6_v3", "UI17:annotation", "rc_path_sunlight_review"}
    return [case for case in REVIEW_CASES if case["object_id"] in ids and case["status"] in UNRESOLVED_REVIEW_STATUSES]


def _publish_guard() -> dict[str, Any]:
    blocking = _blocking_cases_for_path()
    if blocking:
        return {
            "allowed": False,
            "code": "BLOCKING_REVIEW_CASE",
            "message": "Unresolved ReviewCase blocks publish, recommend, and update flows.",
            "reviewCaseIds": [case["review_case_id"] for case in blocking],
        }
    return {"allowed": True, "code": "READY_TO_PUBLISH", "message": "Path can be published."}


def _student_safe_projection() -> dict[str, Any]:
    path = _path()
    return {
        "pathId": path["pathId"],
        "pathVersion": path["version"],
        "learnerLabel": path["learnerLabel"],
        "unitTitle": path["unitTitle"],
        "goal": path["goal"],
        "status": "REVIEW_PENDING",
        "studentText": path["teacherAuditExplanation"]["studentText"],
        "safeReasonChips": ["Remember", "Understand", "Analyze", "Photosynthesis", "Evidence reasoning"],
        "steps": [
            {
                "stepNo": index + 1,
                "title": task["title"],
                "taskType": task["taskType"],
                "minutes": task["minutes"],
                "bloomLabel": task["bloom"],
                "thinkingLabel": task["thinking"],
                "nodeLabels": task["nodeLabels"],
                "status": "AVAILABLE" if index == 0 else "LOCKED",
            }
            for index, task in enumerate(path["tasks"])
        ],
        "syncBadge": "Review pending",
    }


class AdminMockStore:
    def scope(self, user: CurrentUser) -> dict[str, Any]:
        class_id = "class_g7_a" if "class_g7_a" in user.class_ids else (user.class_ids[0] if user.class_ids else None)
        return {
            "organizationId": user.organization_id,
            "organizationName": "Greenwood Middle School",
            "role": user.role,
            "roleLabel": {
                "teacher": "English teacher",
                "curriculum_researcher": "Curriculum researcher",
                "expert": "Expert reviewer",
                "admin": "System admin",
            }.get(user.role, user.role),
            "classId": class_id,
            "classLabel": "Grade 7 English A" if class_id else None,
            "reviewScope": "Assigned class paths and outputs" if user.role == "teacher" else "Business review scope",
            "mockMode": True,
        }

    def dashboard(self, user: CurrentUser) -> dict[str, Any]:
        guard = _publish_guard()
        return {
            "mock": True,
            "scope": self.scope(user),
            "metrics": [
                {"label": "Assigned class scope", "value": "Grade 7 English A", "detail": "32 students; Unit 6 active", "tone": "info", "href": "/admin/classes/class_g7_a/diagnosis"},
                {"label": "Path reviews", "value": "8", "detail": "3 blocked by ReviewCase", "tone": "warning", "href": "/admin/paths/pth_xiaoming_u6_v3/review"},
                {"label": "Review queue", "value": "15", "detail": "5 assigned to you; 2 high-risk", "tone": "danger", "href": "/admin/review-cases"},
                {"label": "LMS sync", "value": "2", "detail": "Dead-letter items need retry or compensation", "tone": "blocked", "href": "/admin/monitoring/lms"},
            ],
            "workQueueRows": _work_queue_rows(),
            "diagnosisRows": self.diagnosis_rows(),
            "monitoringRows": self.monitoring_rows(),
            "publishGuard": guard,
            "decisionTraces": deepcopy(DECISION_TRACES),
            "safeProjectionPreview": _student_safe_projection(),
        }

    def review_cases(self) -> dict[str, Any]:
        return {"items": deepcopy(REVIEW_CASES), "rows": _work_queue_rows()}

    def path_review(self, path_id: str, user: CurrentUser) -> dict[str, Any]:
        path = _path()
        if path_id != path["pathId"]:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Path not found")
        if user.role == "teacher" and path["classId"] not in user.class_ids:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher is not assigned to this class")
        return {
            "scope": self.scope(user),
            "path": path,
            "reviewCases": deepcopy(REVIEW_CASES),
            "decisionTraces": deepcopy(DECISION_TRACES),
            "publishGuard": _publish_guard(),
            "safeProjectionPreview": _student_safe_projection(),
        }

    def record_path_decision(self, *, path_id: str, path_version: int, action: str, reason: str | None, user: CurrentUser) -> dict[str, Any]:
        path = _path()
        if path_id != path["pathId"]:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Path not found")
        if path_version != path["version"]:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Path version is stale")
        trace = _decision_trace(
            actor_user_id=user.user_id,
            actor_label=user.display_name,
            action=action,
            object_id=path_id,
            before_snapshot_ref=f"snapshot://paths/{path_id}/v{path_version}",
            after_snapshot_ref=f"snapshot://paths/{path_id}/v{path_version + 1}" if action in {"MODIFY", "REPLAN"} else None,
            reason=reason,
        )
        return {"object_id": path_id, "status": path["status"], "version": path_version, "decision_trace_id": trace["trace_id"], "decisionTrace": trace, "publishGuard": _publish_guard()}

    def content_rows(self) -> list[dict[str, Any]]:
        return deepcopy(CONTENT_ROWS)

    def taxonomy_rows(self) -> list[dict[str, Any]]:
        return deepcopy(TAXONOMY_ROWS)

    def annotation_rows(self) -> list[dict[str, Any]]:
        rows = []
        for index, task in enumerate(TASKS):
            blocked = task["taskId"] == "UI17"
            rows.append(
                {
                    "task": task["title"],
                    "module": task["module"],
                    "candidate": ", ".join(task["nodeLabels"]),
                    "confidence": "Low" if blocked else ("Medium" if index > 3 else "High"),
                    "lint": "BLOCK" if blocked else ("REVIEW" if index == 3 else "INFO"),
                    "status": "ReviewCase assigned" if blocked else ("Review required" if index == 3 else "Ready for researcher"),
                    "href": f"/admin/annotations/{task['taskId']}:annotation",
                    "meta": f"{task['taskId']}:annotation",
                }
            )
        return rows

    def package_rows(self) -> list[dict[str, Any]]:
        return [
            {"title": "Unit 6 foundational plant process package", "audience": "Grade 7 English", "tasks": 24, "lint": "PASS", "status": "Published locked", "href": "/admin/assembly/pkg_u6_foundation_v1", "meta": "pkg_u6_foundation_v1"},
            {"title": "Speaking and explanation extension set", "audience": "Teacher-reviewed delivery", "tasks": 12, "lint": "REVIEW", "status": "ReviewCase required", "href": "/admin/assembly/pkg_u6_speaking_v2", "meta": "pkg_u6_speaking_v2"},
        ]

    def diagnosis_rows(self) -> list[dict[str, Any]]:
        return [
            {"learner": "Xiaoming Zhang", "evidence": "Tentative evidence", "bkt": "Growing", "bloom": "Understand confirmed; Evaluate insufficient", "thinking": "Sequence strong; evidence reasoning growing", "path": "Needs teacher review", "href": "/admin/students/learner_xiaoming/diagnosis", "meta": "learner_xiaoming"},
            {"learner": "Mina Park", "evidence": "Sufficient evidence", "bkt": "Strong", "bloom": "Apply confirmed", "thinking": "Evidence reasoning strong", "path": "Published", "href": "/admin/students/learner_mina/diagnosis", "meta": "learner_mina"},
            {"learner": "Jon Lee", "evidence": "Low confidence", "bkt": "Needs Practice", "bloom": "Remember emerging", "thinking": "Observation growing", "path": "Generate path", "href": "/admin/students/learner_jon/diagnosis", "meta": "learner_jon"},
        ]

    def rule_rows(self) -> list[dict[str, Any]]:
        return [
            {"name": "Unit 6 teacher default rule profile", "status": "Released", "rollout": "Grade 7 English A", "constraints": "35 min path cap; speaking after vocabulary evidence", "href": "/admin/rules/rules-u6-teacher-default-v4", "meta": "rules-u6-teacher-default-v4"},
            {"name": "Low-risk objective auto-delivery sampling", "status": "Draft", "rollout": "Not enabled", "constraints": "Requires explicit teacher enablement", "href": "/admin/rules/rules-u6-low-risk-auto-v1", "meta": "rules-u6-low-risk-auto-v1"},
        ]

    def research_rows(self) -> list[dict[str, Any]]:
        return [
            {"claim": "Spacing vocabulary before oral retelling improves retrieval quality.", "source": "Teacher rules source packet", "status": "Expert approved", "citation": "citation:src_teacher_rules_12", "href": "/admin/research/claim_spacing_before_speaking", "meta": "claim_spacing_before_speaking"},
            {"claim": "Student explanation tasks should separate evidence selection from reasoning quality.", "source": "Research evidence draft", "status": "Citation lint review", "citation": "citation:src_evidence_09", "href": "/admin/research/claim_evidence_reasoning_split", "meta": "claim_evidence_reasoning_split"},
        ]

    def monitoring_rows(self) -> list[dict[str, Any]]:
        return [
            {"workflow": "Path publication LMS sync", "status": "DEAD_LETTER", "object": "Grade 7 English A Unit 6 path publish", "retry": "Retry waiting after admin reason", "trace": "/foundation/audit/traces/trc_lms_dead_letter", "meta": "sync_u6_path_publish_42"},
            {"workflow": "Content annotation", "status": "SUCCEEDED", "object": "Plant vocabulary task annotations", "retry": "No retry needed", "trace": "/foundation/audit/traces/trc_annotation_success", "meta": "agent_annotation_214"},
            {"workflow": "Diagnosis summarizer", "status": "REVIEW", "object": "Xiaoming Zhang Unit 6 evidence refresh", "retry": "Teacher ReviewCase created", "trace": "/foundation/audit/traces/trc_diagnosis_review", "meta": "agent_diagnosis_088"},
        ]


admin_store = AdminMockStore()
