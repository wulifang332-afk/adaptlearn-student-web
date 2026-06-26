from __future__ import annotations

import math
from copy import deepcopy
from threading import RLock
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, status

from app.core.audit import new_trace_id

MOCK_SIMULATION_NOTICE = "Prototype data; not a real model result."

BASE_PATH_TASKS: list[dict[str, Any]] = [
    {
        "stepNo": 1,
        "taskId": "UI01",
        "title": "Label the parts of a plant",
        "module": "Plant vocabulary",
        "taskType": "Word-picture matching",
        "prompt": "Match each plant word to the diagram.",
        "responseFormat": "Select one label for each plant part.",
        "bloom": "Remember",
        "thinking": "Observation",
        "difficulty": "Easy",
        "minutes": 4,
        "status": "AVAILABLE",
        "nodeNames": ["root", "stem", "leaf", "seed"],
        "studentReason": "Focus: plant part words",
        "riskLabel": "Low risk",
        "interactionKind": "plant_label",
        "options": {
            "targets": [
                {"key": "leaf", "label": "A", "helper": "green flat part"},
                {"key": "stem", "label": "B", "helper": "supports the plant"},
                {"key": "seed", "label": "C", "helper": "new plant starter"},
                {"key": "root", "label": "D", "helper": "under the soil"},
            ],
            "labels": ["root", "stem", "leaf", "seed"],
        },
    },
    {
        "stepNo": 2,
        "taskId": "UI02",
        "title": "Classify photosynthesis inputs and outputs",
        "module": "Photosynthesis",
        "taskType": "Classification",
        "prompt": "Sort each card into Inputs, Outputs, or Helpers.",
        "responseFormat": "Choose one category for each term.",
        "bloom": "Understand",
        "thinking": "Compare",
        "difficulty": "Easy",
        "minutes": 5,
        "status": "LOCKED",
        "nodeNames": ["sunlight", "water", "carbon dioxide", "oxygen", "glucose", "chlorophyll"],
        "studentReason": "Focus: inputs and outputs",
        "riskLabel": "Low risk",
        "interactionKind": "classification",
        "options": {
            "terms": ["sunlight", "water", "carbonDioxide", "oxygen", "glucose", "chlorophyll"],
            "zones": [
                {"key": "inputs", "label": "Inputs"},
                {"key": "outputs", "label": "Outputs"},
                {"key": "helpers", "label": "Helpers"},
            ],
        },
    },
    {
        "stepNo": 3,
        "taskId": "UI03",
        "title": "Build the photosynthesis process",
        "module": "Photosynthesis",
        "taskType": "Process sequencing",
        "prompt": "Put the photosynthesis events in the best order.",
        "responseFormat": "Tap the cards in sequence.",
        "bloom": "Apply",
        "thinking": "Sequence",
        "difficulty": "Medium",
        "minutes": 6,
        "status": "LOCKED",
        "nodeNames": ["water", "carbon dioxide", "sunlight", "glucose", "oxygen"],
        "studentReason": "Focus: process order",
        "riskLabel": "Low risk",
        "interactionKind": "sequence",
        "options": {
            "steps": [
                {"key": "water", "label": "Roots take in water"},
                {"key": "carbon", "label": "Leaves take in carbon dioxide"},
                {"key": "sunlight", "label": "Sunlight gives energy"},
                {"key": "glucose", "label": "Leaves make glucose"},
                {"key": "oxygen", "label": "Oxygen is released"},
            ]
        },
    },
    {
        "stepNo": 4,
        "taskId": "UI08",
        "title": "Find what changes when sunlight is missing",
        "module": "Cause and effect",
        "taskType": "Multiple choice",
        "prompt": "Choose the 3 changes caused by missing sunlight.",
        "responseFormat": "Select all correct changes.",
        "bloom": "Analyze",
        "thinking": "Cause and effect",
        "difficulty": "Medium",
        "minutes": 5,
        "status": "LOCKED",
        "nodeNames": ["glucose", "oxygen", "growth"],
        "studentReason": "Focus: cause and effect",
        "riskLabel": "Low risk",
        "interactionKind": "multi_select",
        "options": {
            "choices": [
                {"key": "glucose", "label": "Less glucose"},
                {"key": "oxygen", "label": "Less oxygen"},
                {"key": "growth", "label": "Slower growth"},
                {"key": "water", "label": "Water disappears"},
            ]
        },
    },
    {
        "stepNo": 5,
        "taskId": "UI04",
        "title": "Choose the best explanation",
        "module": "Evidence",
        "taskType": "Explanation evaluation",
        "prompt": "Choose the strongest explanation and the reason.",
        "responseFormat": "Pick one explanation and one reason.",
        "bloom": "Evaluate",
        "thinking": "Evidence use",
        "difficulty": "Medium",
        "minutes": 6,
        "status": "LOCKED",
        "nodeNames": ["evidence", "cause and effect"],
        "studentReason": "Focus: stronger evidence",
        "riskLabel": "Low risk",
        "interactionKind": "evaluation",
        "options": {
            "explanations": [
                {
                    "key": "strong",
                    "label": "Plants use water, carbon dioxide, and sunlight to make glucose. Oxygen is released.",
                },
                {"key": "soil", "label": "Plants eat soil and turn it into oxygen when the sun is bright."},
                {"key": "green", "label": "Leaves make oxygen because plants are green."},
            ],
            "reasons": [
                {"key": "evidence", "label": "uses evidence"},
                {"key": "sequence", "label": "includes correct sequence"},
                {"key": "causeEffect", "label": "explains cause and effect"},
                {"key": "missingVocabulary", "label": "missing key vocabulary"},
            ],
        },
    },
    {
        "stepNo": 6,
        "taskId": "UI17",
        "title": "Retell photosynthesis in your own words",
        "module": "Speaking",
        "taskType": "Oral retelling",
        "prompt": "Record a short retelling of photosynthesis.",
        "responseFormat": "Simulated short audio recording.",
        "bloom": "Create",
        "thinking": "Explain",
        "difficulty": "Medium",
        "minutes": 7,
        "status": "LOCKED",
        "nodeNames": ["sunlight", "glucose", "oxygen"],
        "studentReason": "Focus: clear oral explanation",
        "riskLabel": "Extra review",
        "interactionKind": "speaking",
        "options": {"maxSeconds": 120, "languageHint": "en"},
    },
]

SIMILAR_TASKS: dict[str, dict[str, Any]] = {
    "SIM_UI01": {
        "taskId": "SIM_UI01",
        "stepNo": 0,
        "title": "Label leaf, flower, and seed",
        "module": "Plant vocabulary",
        "taskType": "Similar practice",
        "prompt": "Use a new plant picture and match each visible part to the correct word.",
        "responseFormat": "Select one label for each plant part.",
        "bloom": "Remember",
        "thinking": "Observation",
        "difficulty": "Easy",
        "minutes": 4,
        "status": "AVAILABLE",
        "nodeNames": ["leaf", "flower", "seed"],
        "studentReason": "Same skill, new plant picture.",
        "riskLabel": "Low risk",
        "interactionKind": "similar_label",
        "options": {
            "targets": [
                {"key": "top", "label": "A", "helper": "bright part where seeds can form"},
                {"key": "middle", "label": "B", "helper": "wide green part"},
                {"key": "bottom", "label": "C", "helper": "new plant starter"},
            ],
            "labels": ["leaf", "flower", "seed"],
        },
    },
    "SIM_UI02": {
        "taskId": "SIM_UI02",
        "stepNo": 0,
        "title": "Classify daytime plant exchange",
        "module": "Photosynthesis",
        "taskType": "Similar practice",
        "prompt": "Sort what enters the plant, what leaves it, and what is not used here.",
        "responseFormat": "Choose one category for each term.",
        "bloom": "Understand",
        "thinking": "Compare",
        "difficulty": "Easy",
        "minutes": 5,
        "status": "AVAILABLE",
        "nodeNames": ["water", "carbon dioxide", "oxygen"],
        "studentReason": "Same sorting skill, new daytime exchange.",
        "riskLabel": "Low risk",
        "interactionKind": "similar_classification",
        "options": {
            "terms": ["water", "carbonDioxide", "oxygen", "glucose", "soil", "sunlight"],
            "zones": [
                {"key": "takenIn", "label": "Taken in"},
                {"key": "givenOut", "label": "Given out"},
                {"key": "notUsed", "label": "Not used here"},
            ],
        },
    },
    "SIM_UI03": {
        "taskId": "SIM_UI03",
        "stepNo": 0,
        "title": "Order sunlight-to-oxygen steps",
        "module": "Photosynthesis",
        "taskType": "Similar practice",
        "prompt": "Put the events in order from sunlight reaching a leaf to oxygen leaving the plant.",
        "responseFormat": "Tap the cards in sequence.",
        "bloom": "Apply",
        "thinking": "Sequence",
        "difficulty": "Easy",
        "minutes": 4,
        "status": "AVAILABLE",
        "nodeNames": ["sunlight", "glucose", "oxygen"],
        "studentReason": "Same sequence skill, shorter process.",
        "riskLabel": "Low risk",
        "interactionKind": "similar_sequence",
        "options": {
            "steps": [
                {"key": "sunlight", "label": "Sunlight reaches a leaf"},
                {"key": "glucose", "label": "Leaf cells make glucose"},
                {"key": "oxygen", "label": "Oxygen leaves the leaf"},
            ]
        },
    },
    "SIM_UI04": {
        "taskId": "SIM_UI04",
        "stepNo": 0,
        "title": "Pick the explanation with stronger evidence",
        "module": "Evidence",
        "taskType": "Similar practice",
        "prompt": "Compare two new explanations and choose the one that uses better plant-process evidence.",
        "responseFormat": "Pick one explanation.",
        "bloom": "Evaluate",
        "thinking": "Evidence use",
        "difficulty": "Medium",
        "minutes": 5,
        "status": "AVAILABLE",
        "nodeNames": ["evidence", "cause and effect"],
        "studentReason": "Same explanation skill, new examples.",
        "riskLabel": "Low risk",
        "interactionKind": "similar_evaluation",
        "options": {
            "explanations": [
                {
                    "key": "better",
                    "label": "Without sunlight, the leaf has less energy to make glucose, so less oxygen is released.",
                },
                {"key": "weaker", "label": "Without sunlight, the plant is sad and does not want to grow."},
            ]
        },
    },
}


class MockAdaptLearnStore:
    def __init__(self) -> None:
        self._lock = RLock()
        self.reset()

    def reset(self) -> None:
        with self._lock:
            self.tasks = deepcopy(BASE_PATH_TASKS)
            self.submissions_by_key: dict[str, dict[str, Any]] = {}
            self.agent_runs: list[dict[str, Any]] = []
            self.tool_calls: list[dict[str, Any]] = []
            self.queue_jobs: list[dict[str, Any]] = []
            self.trace_events: list[dict[str, Any]] = []
            self.audit_logs: list[dict[str, Any]] = []
            self.rag_documents: list[dict[str, Any]] = []
            self.rag_chunks: list[dict[str, Any]] = []
            self.media_uploads: list[dict[str, Any]] = []
            self.lms_sync_statuses: list[dict[str, Any]] = []
            self.lms_dead_letters: list[dict[str, Any]] = []

    def _task_cards(self) -> list[dict[str, Any]]:
        cards = []
        for task in self.tasks:
            card = deepcopy(task)
            card["isActionable"] = card["status"] in {"AVAILABLE", "IN_PROGRESS", "COMPLETED"}
            card["projection"] = "student_task_view"
            card["safeStatus"] = "ready" if card["status"] != "REVIEW_PENDING" else "review_pending"
            cards.append(card)
        return cards

    def _path(self) -> dict[str, Any]:
        cards = self._task_cards()
        return {
            "pathId": "PTH01",
            "goal": "Plant vocabulary and process foundation",
            "version": 1,
            "status": "PUBLISHED",
            "projection": "student_learning_path_view",
            "safeStatus": "ready",
            "totalMinutes": sum(task["minutes"] for task in cards),
            "completedCount": len([task for task in cards if task["status"] == "COMPLETED"]),
            "totalCount": len(cards),
            "taskCards": cards,
        }

    def get_home(self, student_id: str) -> dict[str, Any]:
        self._require_student(student_id)
        path = self._path()
        recommended = next(
            (task for task in path["taskCards"] if task["status"] in {"IN_PROGRESS", "AVAILABLE"}),
            path["taskCards"][0],
        )
        return {
            "mock": True,
            "simulationNotice": MOCK_SIMULATION_NOTICE,
            "projection": "student_home_view",
            "safeStatus": "ready",
            "student": {
                "studentId": student_id,
                "displayName": "Xiaoming Zhang",
                "course": "Grade 7 English",
            },
            "unit": {
                "id": "U6",
                "title": "The Power of Plants",
                "theme": "Plant process",
                "dueLabel": "Due Today",
            },
            "activePath": {key: value for key, value in path.items() if key != "taskCards"} | {
                "route": "/student/path/PTH01",
                "safeSyncStatus": "ready",
            },
            "recommendedTask": recommended,
        }

    def get_path(self, student_id: str, path_id: str) -> dict[str, Any]:
        self._require_student(student_id)
        if path_id != "PTH01":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Path not found")
        return {"mock": True, "simulationNotice": MOCK_SIMULATION_NOTICE, **self._path()}

    def get_task(self, student_id: str, task_id: str) -> dict[str, Any]:
        self._require_student(student_id)
        task = self._find_task(task_id)
        if not task["isActionable"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Task is locked")
        return {"mock": True, "simulationNotice": MOCK_SIMULATION_NOTICE, "task": task}

    def submit_task(
        self,
        *,
        student_id: str,
        task_id: str,
        path_id: str,
        path_version: int,
        response: dict[str, Any],
        idempotency_key: str,
        actor_user_id: str,
        request_id: str,
        trace_id: str,
    ) -> dict[str, Any]:
        self._require_student(student_id)
        if path_id != "PTH01" or path_version != 1:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Path version is stale")

        with self._lock:
            if idempotency_key in self.submissions_by_key:
                return deepcopy(self.submissions_by_key[idempotency_key])

            task = self._find_task(task_id)
            if not task["isActionable"]:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Task is locked")

            feedback = score_task(task_id, response)
            agent_run = self.record_agent_run(
                user_id=actor_user_id,
                workflow_type="grade_objective_task" if feedback["feedbackKind"] != "speaking" else "feedback_speaking",
                payload_ref=f"mock://submission/{idempotency_key}",
                status_value="SUCCEEDED",
                model_id="mock-openai-adapter",
                trace_id=trace_id,
            )
            tool_call = self.record_tool_call(
                agent_run_id=agent_run["agentRunId"],
                tool_name="rubric_lookup" if feedback["feedbackKind"] != "speaking" else "feedback_generator",
                input_ref=f"mock://submission/{idempotency_key}/response",
                output_ref=f"mock://submission/{idempotency_key}/feedback",
                status_value="SUCCEEDED",
            )
            queue_job = self.record_queue_job(
                workflow_type=agent_run["workflowType"],
                payload_ref=f"mock://submission/{idempotency_key}",
                trace_id=trace_id,
                status_value="SUCCEEDED",
            )
            self.record_trace_event(
                trace_id=trace_id,
                event_type="student_submission_safe_projection",
                object_ref=f"StudentSubmission:{idempotency_key}",
            )
            self.record_audit_log(
                actor_user_id=actor_user_id,
                action="student_submission.create",
                object_type="StudentSubmission",
                object_id=idempotency_key,
                request_id=request_id,
                trace_id=trace_id,
                job_id=queue_job["queueJobId"],
                initiated_by="student_api",
            )

            source_task_id = task_id.replace("SIM_", "")
            next_task_id = self._next_task_id(source_task_id)
            submission_status = "REVIEW_PENDING" if source_task_id == "UI17" else "COMPLETED"
            submission = {
                "projection": "student_feedback_view",
                "safeStatus": "review_pending" if submission_status == "REVIEW_PENDING" else "ready",
                "submissionId": f"sub_{uuid4().hex}",
                "status": submission_status,
                "feedback": feedback,
                "nextTaskId": next_task_id,
                "agentRunId": agent_run["agentRunId"],
                "toolCallId": tool_call["toolCallId"],
                "queueJobId": queue_job["queueJobId"],
                "traceId": trace_id,
                "requestId": request_id,
            }

            if not task_id.startswith("SIM_"):
                self._complete_and_unlock(task_id)

            self.submissions_by_key[idempotency_key] = submission
            return deepcopy(submission)

    def start_similar(self, student_id: str, source_task_id: str, actor_user_id: str) -> dict[str, Any]:
        self._require_student(student_id)
        similar_id = f"SIM_{source_task_id.replace('SIM_', '')}"
        if similar_id not in SIMILAR_TASKS:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Similar practice not available")
        agent_run = self.record_agent_run(
            user_id=actor_user_id,
            workflow_type="generate_similar_practice",
            payload_ref=f"mock://similar/{source_task_id}",
            status_value="SUCCEEDED",
            model_id="mock-openai-adapter",
        )
        self.record_tool_call(
            agent_run_id=agent_run["agentRunId"],
            tool_name="similar_task_generator",
            input_ref=f"mock://similar/{source_task_id}/constraints",
            output_ref=f"mock://tasks/{similar_id}",
            status_value="SUCCEEDED",
        )
        return {"similarTaskId": similar_id, "task": self._find_task(similar_id), "agentRunId": agent_run["agentRunId"]}

    def get_progress(self, student_id: str) -> dict[str, Any]:
        self._require_student(student_id)
        path = self._path()
        completed_count = path["completedCount"]
        return {
            "mock": True,
            "simulationNotice": MOCK_SIMULATION_NOTICE,
            "credits": 128 + completed_count * 8,
            "completedCount": completed_count,
            "totalCount": path["totalCount"],
            "reviewItems": [
                {
                    "taskId": "UI01",
                    "similarTaskId": "SIM_UI01",
                    "title": "Label root and stem",
                    "focus": "Vocabulary Understanding",
                    "lastResult": "Plant words",
                },
                {
                    "taskId": "UI02",
                    "similarTaskId": "SIM_UI02",
                    "title": "Classify photosynthesis inputs",
                    "focus": "Inputs and outputs",
                    "lastResult": "Sort cards",
                },
            ],
        }

    def get_profile(self, student_id: str) -> dict[str, Any]:
        self._require_student(student_id)
        return {
            "mock": True,
            "simulationNotice": MOCK_SIMULATION_NOTICE,
            "identity": {
                "course": "Grade 7 English",
                "unit": "Unit 6",
                "unitTitle": "The Power of Plants",
                "focus": "Vocabulary foundation",
            },
            "abilities": [
                {"label": "Vocabulary Understanding", "band": "Growing", "note": "Plant words"},
                {"label": "Process Sequencing", "band": "Growing", "note": "Process steps"},
                {"label": "Evidence Use", "band": "Needs Practice", "note": "Proof words"},
            ],
            "thinkingSkills": [
                {"label": "Observe", "band": "Growing", "next": "Name what you see."},
                {"label": "Explain", "band": "Needs Practice", "next": "Add one reason."},
                {"label": "Reflect", "band": "Growing", "next": "Check one answer."},
            ],
            "strategies": ["Read aloud", "Label first, explain next", "Use evidence words", "Check sequence words"],
            "badges": [
                {"label": "Vocabulary Builder", "detail": "Plant words"},
                {"label": "Evidence Finder", "detail": "Proof words"},
            ],
            "classInfo": {"name": "Class 104", "group": "Group 6", "weeklyGoal": "Finish 6-step path"},
        }

    def create_media_upload(self, *, bucket: str, object_path: str, content_type: str, operation: str) -> dict[str, Any]:
        upload = {
            "mediaUploadId": f"media_{uuid4().hex}",
            "bucket": bucket,
            "objectPath": object_path,
            "contentType": content_type,
            "operation": operation,
            "status": "SIGNED",
            "signedUrl": f"mock://supabase-storage/{bucket}/{object_path}?operation={operation}",
            "expiresInSeconds": 900,
            "projection": "student_upload_status_view",
            "safeStatus": "ready",
        }
        self.media_uploads.append(upload)
        return upload

    def register_rag_document(self, *, source_type: str, title: str, text: str, embedding: list[float]) -> dict[str, Any]:
        document = {
            "documentId": f"rag_doc_{uuid4().hex}",
            "sourceType": source_type,
            "title": title,
            "status": "ingested",
        }
        self.rag_documents.append(document)
        chunks = chunk_text(text)
        for index, chunk in enumerate(chunks):
            self.rag_chunks.append(
                {
                    "chunkId": f"rag_chunk_{uuid4().hex}",
                    "documentId": document["documentId"],
                    "sourceType": source_type,
                    "chunkIndex": index,
                    "text": chunk,
                    "embedding": embedding,
                    "citation": f"{title}#chunk-{index + 1}",
                }
            )
        return document | {"chunkCount": len(chunks)}

    def rag_search(self, *, query_embedding: list[float], source_types: list[str], top_k: int) -> dict[str, Any]:
        candidates = [
            chunk for chunk in self.rag_chunks if not source_types or chunk["sourceType"] in set(source_types)
        ]
        ranked = sorted(
            candidates,
            key=lambda chunk: cosine_similarity(query_embedding, chunk["embedding"]),
            reverse=True,
        )[:top_k]
        return {
            "chunks": [
                {
                    "chunkId": chunk["chunkId"],
                    "score": round(cosine_similarity(query_embedding, chunk["embedding"]), 4),
                    "citation": chunk["citation"],
                    "text": chunk["text"],
                }
                for chunk in ranked
            ]
        }

    def record_agent_run(
        self,
        *,
        user_id: str,
        workflow_type: str,
        payload_ref: str,
        status_value: str,
        model_id: str,
        trace_id: str | None = None,
    ) -> dict[str, Any]:
        run = {
            "agentRunId": f"agent_run_{uuid4().hex}",
            "traceId": trace_id or new_trace_id(),
            "userId": user_id,
            "workflowType": workflow_type,
            "payloadRef": payload_ref,
            "status": status_value,
            "modelId": model_id,
            "toolCallCount": 0,
        }
        self.agent_runs.append(run)
        return run

    def record_tool_call(
        self,
        *,
        agent_run_id: str,
        tool_name: str,
        input_ref: str,
        output_ref: str,
        status_value: str,
    ) -> dict[str, Any]:
        call = {
            "toolCallId": f"tool_call_{uuid4().hex}",
            "agentRunId": agent_run_id,
            "toolName": tool_name,
            "inputRef": input_ref,
            "outputRef": output_ref,
            "status": status_value,
        }
        self.tool_calls.append(call)
        for run in self.agent_runs:
            if run["agentRunId"] == agent_run_id:
                run["toolCallCount"] += 1
        return call

    def record_queue_job(
        self,
        *,
        workflow_type: str,
        payload_ref: str,
        trace_id: str,
        status_value: str,
    ) -> dict[str, Any]:
        job = {
            "queueJobId": f"queue_job_{uuid4().hex}",
            "workflowType": workflow_type,
            "payloadRef": payload_ref,
            "traceId": trace_id,
            "status": status_value,
            "retryCount": 0,
        }
        self.queue_jobs.append(job)
        return job

    def record_trace_event(self, *, trace_id: str, event_type: str, object_ref: str) -> dict[str, Any]:
        event = {
            "traceEventId": f"trace_event_{uuid4().hex}",
            "traceId": trace_id,
            "eventType": event_type,
            "objectRef": object_ref,
        }
        self.trace_events.append(event)
        return event

    def record_audit_log(
        self,
        *,
        actor_user_id: str,
        action: str,
        object_type: str,
        object_id: str,
        request_id: str,
        trace_id: str,
        job_id: str | None,
        initiated_by: str,
    ) -> dict[str, Any]:
        audit = {
            "auditLogId": f"audit_log_{uuid4().hex}",
            "actorUserId": actor_user_id,
            "action": action,
            "objectType": object_type,
            "objectId": object_id,
            "requestId": request_id,
            "traceId": trace_id,
            "jobId": job_id,
            "initiatedBy": initiated_by,
        }
        self.audit_logs.append(audit)
        return audit

    def create_lms_sync(
        self,
        *,
        object_type: str,
        object_id: str,
        direction: str,
        trace_id: str | None = None,
    ) -> dict[str, Any]:
        sync = {
            "syncId": f"lms_sync_{uuid4().hex}",
            "objectType": object_type,
            "objectId": object_id,
            "direction": direction,
            "status": "SYNCED",
            "retryCount": 0,
            "externalId": f"mock-lms-{object_type.lower()}-{object_id}",
            "traceId": trace_id or new_trace_id("lms"),
        }
        self.lms_sync_statuses.append(sync)
        return sync

    def _find_task(self, task_id: str) -> dict[str, Any]:
        if task_id in SIMILAR_TASKS:
            task = deepcopy(SIMILAR_TASKS[task_id])
            task["isActionable"] = True
            task["projection"] = "student_task_view"
            task["safeStatus"] = "ready"
            return task
        cards = self._task_cards()
        for task in cards:
            if task["taskId"] == task_id:
                return task
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    def _next_task_id(self, task_id: str) -> str | None:
        source_ids = [task["taskId"] for task in self.tasks]
        if task_id not in source_ids:
            return None
        index = source_ids.index(task_id)
        if index + 1 >= len(source_ids):
            return None
        return source_ids[index + 1]

    def _complete_and_unlock(self, task_id: str) -> None:
        for index, task in enumerate(self.tasks):
            if task["taskId"] != task_id:
                continue
            task["status"] = "COMPLETED"
            if index + 1 < len(self.tasks) and self.tasks[index + 1]["status"] == "LOCKED":
                self.tasks[index + 1]["status"] = "AVAILABLE"
            return

    @staticmethod
    def _require_student(student_id: str) -> None:
        if student_id != "stu_persona_a":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student can access only own data")


def score_task(task_id: str, response: dict[str, Any]) -> dict[str, Any]:
    source_task_id = task_id.replace("SIM_", "")
    practice = task_id.startswith("SIM_")

    if source_task_id == "UI01":
        labels = response.get("labels") or {}
        expected = (
            {"top": "flower", "middle": "leaf", "bottom": "seed"}
            if practice
            else {"root": "root", "stem": "stem", "leaf": "leaf", "seed": "seed"}
        )
        correct = sum(1 for key, value in expected.items() if labels.get(key) == value)
        return build_feedback(task_id, "Label leaf, flower, and seed" if practice else "Label the parts of a plant", practice, correct, len(expected))

    if source_task_id == "UI02":
        zones = response.get("classification") or {}
        expected = (
            {
                "water": "takenIn",
                "carbonDioxide": "takenIn",
                "oxygen": "givenOut",
                "glucose": "notUsed",
                "soil": "notUsed",
                "sunlight": "notUsed",
            }
            if practice
            else {
                "sunlight": "inputs",
                "water": "inputs",
                "carbonDioxide": "inputs",
                "oxygen": "outputs",
                "glucose": "outputs",
                "chlorophyll": "helpers",
            }
        )
        correct = sum(1 for key, value in expected.items() if zones.get(key) == value)
        return build_feedback(task_id, "Classify daytime plant exchange" if practice else "Classify photosynthesis inputs and outputs", practice, correct, len(expected))

    if source_task_id == "UI03":
        order = response.get("order") or []
        expected = ["sunlight", "glucose", "oxygen"] if practice else ["water", "carbon", "sunlight", "glucose", "oxygen"]
        correct = sum(1 for index, value in enumerate(expected) if index < len(order) and order[index] == value)
        return build_feedback(task_id, "Order sunlight-to-oxygen steps" if practice else "Build the photosynthesis process", practice, correct, len(expected))

    if source_task_id == "UI08":
        selected = set(response.get("selected") or [])
        raw = len(selected.intersection({"glucose", "oxygen", "growth"})) - len(selected.intersection({"water"}))
        return build_feedback(task_id, "Find what changes when sunlight is missing", False, max(0, raw), 3)

    if source_task_id == "UI04":
        correct = int(response.get("explanation") in {"strong", "better"}) + int(
            response.get("reason") in {"causeEffect", "evidence"}
        )
        return build_feedback(task_id, "Pick the explanation with stronger evidence" if practice else "Choose the best explanation", practice, correct, 2)

    if source_task_id == "UI17":
        return {
            "taskId": task_id,
            "title": "Retell photosynthesis in your own words",
            "feedbackKind": "speaking",
            "correctCount": 0,
            "totalCount": 0,
            "resultText": "Speaking feedback",
            "summary": "Retelling draft saved.",
            "detail": "Good retelling start. Try adding sunlight, glucose, and oxygen in one clear sequence.",
            "safeForStudent": True,
        }

    return build_feedback(task_id, "Practice", practice, 0, 1)


def build_feedback(task_id: str, title: str, practice: bool, correct_count: int, total_count: int) -> dict[str, Any]:
    return {
        "taskId": task_id,
        "title": title,
        "feedbackKind": "practice" if practice else "score",
        "correctCount": correct_count,
        "totalCount": total_count,
        "resultText": "Practice feedback" if practice else "Result",
        "summary": "Same skill, new example." if practice else f"{correct_count} of {total_count} correct",
        "detail": "Nice work. You can move to the next step."
        if correct_count == total_count
        else "Review the plant-process evidence, then try the next guided step.",
        "safeForStudent": True,
    }


def chunk_text(text: str, size: int = 700) -> list[str]:
    normalized = " ".join(text.split())
    if not normalized:
        return []
    return [normalized[index : index + size] for index in range(0, len(normalized), size)]


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right:
        return 0.0
    limit = min(len(left), len(right))
    dot = sum(left[index] * right[index] for index in range(limit))
    left_norm = math.sqrt(sum(value * value for value in left[:limit]))
    right_norm = math.sqrt(sum(value * value for value in right[:limit]))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return dot / (left_norm * right_norm)


store = MockAdaptLearnStore()
