from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class SubmissionIn(BaseModel):
    learnerId: str = Field(min_length=1)
    taskId: str = Field(min_length=1)
    pathId: str
    pathVersion: int
    idempotencyKey: str = Field(min_length=1)
    response: dict[str, Any]
    mediaUploadId: str | None = None


class MediaSignRequest(BaseModel):
    bucket: Literal["student-media", "rag-source-docs", "generated-feedback", "prototype-exports"]
    objectPath: str = Field(min_length=1)
    contentType: str
    operation: Literal["upload", "download"] = "upload"


class RagDocumentIn(BaseModel):
    sourceType: Literal["textbook", "question_bank", "knowledge_graph", "teacher_rules"]
    title: str = Field(min_length=1)
    storageObjectPath: str | None = None
    text: str = Field(min_length=1)
    copyrightStatus: str = "project-controlled"


class RagSearchIn(BaseModel):
    query: str = Field(min_length=1)
    sourceTypes: list[str] = Field(default_factory=list)
    topK: int = Field(default=5, ge=1, le=20)


class AgentRunIn(BaseModel):
    workflowType: str = Field(min_length=1)
    payload: dict[str, Any] = Field(default_factory=dict)


class LmsSyncIn(BaseModel):
    objectType: Literal["LearningPath", "StudentSubmission", "ClassSummary"]
    objectId: str = Field(min_length=1)
    direction: Literal["inbound", "outbound"] = "outbound"
    idempotencyKey: str | None = None


class AdminPathDecisionIn(BaseModel):
    pathVersion: int = Field(gt=0)
    action: Literal["APPROVE", "MODIFY", "REJECT", "REPLAN"]
    reason: str | None = None
