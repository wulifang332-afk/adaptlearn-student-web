from __future__ import annotations

from copy import deepcopy
from typing import Any

from fastapi import HTTPException, status

from app.core.config import Settings
from app.services.mock_store import MOCK_SIMULATION_NOTICE, store

FOUNDATION_PAGES: list[dict[str, str]] = [
    {
        "pageId": "overview",
        "route": "/foundation",
        "label": "System Overview",
        "purpose": "Entry dashboard for tenant, environment, database, queue, storage, RAG, agents, audit, and health readiness.",
        "category": "Platform Base",
    },
    {
        "pageId": "organization",
        "route": "/foundation/organization",
        "label": "Organization & Tenant Settings",
        "purpose": "Manage organization metadata, tenant flags, enabled modules, region labels, and mock-mode flags.",
        "category": "Platform Base",
    },
    {
        "pageId": "users",
        "route": "/foundation/users",
        "label": "User / Role / Class Scope Management",
        "purpose": "Inspect user profiles, role assignments, class memberships, and active scopes.",
        "category": "Platform Base",
    },
    {
        "pageId": "database",
        "route": "/foundation/database",
        "label": "Supabase / Database Health",
        "purpose": "Inspect Supabase project, region, pgvector readiness, migrations, schema versions, indexes, and connection health.",
        "category": "Platform Base",
    },
    {
        "pageId": "rls",
        "route": "/foundation/rls",
        "label": "RLS Policy Viewer / Test Runner",
        "purpose": "View policy matrix, run scoped role tests, validate helper functions, and detect browser service-role exposure.",
        "category": "Platform Base",
    },
    {
        "pageId": "storage",
        "route": "/foundation/storage",
        "label": "Storage Bucket Manager",
        "purpose": "Configure buckets, policies, signed URL checks, MIME allowlists, max-size policy, and retention jobs.",
        "category": "Platform Base",
    },
    {
        "pageId": "rag-sources",
        "route": "/foundation/rag/sources",
        "label": "RAG Source Manager",
        "purpose": "Register source documents and inspect ingestion metadata, parsing, chunking, and retention.",
        "category": "RAG, Agents, Tools",
    },
    {
        "pageId": "rag-indexes",
        "route": "/foundation/rag/indexes",
        "label": "Embedding / Vector Index Monitor",
        "purpose": "Track embedding model, dimensions, vector counts, index state, citation coverage, and retrieval health.",
        "category": "RAG, Agents, Tools",
    },
    {
        "pageId": "agent-workflows",
        "route": "/foundation/agents/workflows",
        "label": "Agent Workflow Registry",
        "purpose": "Manage workflow definitions, model versions, prompt versions, guardrails, and safe-output rules.",
        "category": "RAG, Agents, Tools",
    },
    {
        "pageId": "tools",
        "route": "/foundation/tools",
        "label": "Tool / MCP / API Connector Registry",
        "purpose": "Register tool schemas, secret bindings, allowed workflows, retry/timeout policy, and audit level.",
        "category": "RAG, Agents, Tools",
    },
    {
        "pageId": "jobs",
        "route": "/foundation/jobs",
        "label": "Queue / Job Monitor",
        "purpose": "Inspect queue jobs, retries, dead letters, idempotency, and audit links.",
        "category": "RAG, Agents, Tools",
    },
    {
        "pageId": "lms",
        "route": "/foundation/lms",
        "label": "LMS Connector Settings",
        "purpose": "Configure MockLmsAdapter, OAuth placeholders, scopes, roster/path/submission sync, retry, and failures.",
        "category": "RAG, Agents, Tools",
    },
    {
        "pageId": "audit",
        "route": "/foundation/audit",
        "label": "Audit Log Explorer",
        "purpose": "Search audit logs, agent/tool traces, exported evidence, retention status, and trace-linked records.",
        "category": "Governance",
    },
    {
        "pageId": "environment",
        "route": "/foundation/environment",
        "label": "Environment & Secrets Checklist",
        "purpose": "Check required env vars and ensure server-only secrets are not exposed to browser clients.",
        "category": "Governance",
    },
    {
        "pageId": "health",
        "route": "/foundation/health",
        "label": "System Health / Monitoring",
        "purpose": "Monitor service health, storage/RAG/queue/LMS/OpenAI status, alerts, cleanup jobs, and triage links.",
        "category": "Governance",
    },
    {
        "pageId": "generator",
        "route": "/foundation/generator",
        "label": "Schema / CRUD Generator Console",
        "purpose": "Generate, review, diff, risk-label, and approve low-risk CRUD specs and foundation forms.",
        "category": "Governance",
    },
]

FORBIDDEN_STUDENT_FIELD_TOKENS = [
    "ReviewCase",
    "DecisionTrace",
    "component_scores",
    "rule weights",
    "raw BKT",
    "raw IRT",
    "teacher_text",
    "rule_refs",
    "excluded_task_refs",
    "internal citation deliberation",
    "answer_key_or_rubric",
]

SAFE_PREVIEW_OUTPUT = {
    "learner_id": "learner_demo_001",
    "path_id": "PTH01",
    "path_version": 1,
    "task_id": "UI01",
    "safe_status": "deliverable",
    "student_text": "Practice plant part words before photosynthesis.",
    "safe_reason_chip": "Vocabulary focus",
    "next_action": "Start task",
}

GENERATOR_DRY_RUN_CANDIDATES: list[dict[str, Any]] = [
    {
        "candidateId": "crud_system_settings",
        "sourceSchemaRef": "supabase.public.system_settings",
        "targetSurface": "foundation-console",
        "riskLevel": "LOW",
        "status": "GENERATABLE",
        "allowed": True,
        "reviewRequired": True,
        "safeSummary": "Platform settings metadata list/detail scaffold with trace_id and audit reason fields.",
        "diffSummary": [
            "Add typed table columns for key, value_type, safe_value_preview, updated_at, trace_id.",
            "Add read-only detail metadata and guarded edit form skeleton for later review.",
        ],
        "artifactPaths": [
            "apps/foundation-console/src/generated/system-settings.table.ts",
            "apps/api/app/generated/system_settings_dto.py",
        ],
        "traceId": "trc_generator_system_settings_001",
    },
    {
        "candidateId": "crud_environment_checks",
        "sourceSchemaRef": "supabase.public.environment_checks",
        "targetSurface": "foundation-console",
        "riskLevel": "LOW",
        "status": "GENERATABLE",
        "allowed": True,
        "reviewRequired": True,
        "safeSummary": "Environment readiness table using binding names and status only; secret values remain excluded.",
        "diffSummary": [
            "Add columns for check_id, env_name, status, server_only, value_returned=false, trace_id.",
            "Generate filters for status and server_only without exposing raw environment values.",
        ],
        "artifactPaths": [
            "apps/foundation-console/src/generated/environment-checks.table.ts",
            "apps/api/app/generated/environment_check_dto.py",
        ],
        "traceId": "trc_generator_environment_checks_001",
    },
    {
        "candidateId": "crud_schema_versions",
        "sourceSchemaRef": "supabase.public.schema_versions",
        "targetSurface": "foundation-console",
        "riskLevel": "LOW",
        "status": "GENERATABLE",
        "allowed": True,
        "reviewRequired": True,
        "safeSummary": "Schema version history and compatibility metadata; no business-object mutation.",
        "diffSummary": [
            "Add schema version list columns for version, source, status, applied_at, checksum, notes.",
            "Generate read-only compatibility detail panel with audit metadata.",
        ],
        "artifactPaths": [
            "apps/foundation-console/src/generated/schema-versions.table.ts",
            "apps/api/app/generated/schema_version_dto.py",
        ],
        "traceId": "trc_generator_schema_versions_001",
    },
    {
        "candidateId": "crud_rag_source_metadata",
        "sourceSchemaRef": "supabase.public.rag_documents",
        "targetSurface": "foundation-console",
        "riskLevel": "MEDIUM",
        "status": "REVIEW_REQUIRED",
        "allowed": False,
        "reviewRequired": True,
        "safeSummary": "Non-sensitive source metadata can be scaffolded only after retention and permission review.",
        "diffSummary": [
            "Preview source metadata columns only: source_type, version, permission_class, retention_class, trace_id.",
            "Block parser, chunk, embedding, and raw source preview generation in dry-run mode.",
        ],
        "artifactPaths": [
            "apps/foundation-console/src/generated/rag-source-metadata.preview.ts",
        ],
        "traceId": "trc_generator_rag_sources_001",
    },
    {
        "candidateId": "blocked_learner_state_crud",
        "sourceSchemaRef": "supabase.public.learner_profiles",
        "targetSurface": "admin-web",
        "riskLevel": "BLOCKED",
        "status": "BLOCKED",
        "allowed": False,
        "reviewRequired": True,
        "safeSummary": "Learner state updates stay owned by diagnosis jobs and governed teacher workflows.",
        "diffSummary": [
            "No CRUD scaffold generated.",
            "Use hand-written governed workflow screens and safe projections instead.",
        ],
        "artifactPaths": [],
        "traceId": "trc_generator_block_learner_state_001",
    },
    {
        "candidateId": "blocked_student_component_generation",
        "sourceSchemaRef": "apps/web/src/app/student",
        "targetSurface": "student-web",
        "riskLevel": "BLOCKED",
        "status": "BLOCKED",
        "allowed": False,
        "reviewRequired": True,
        "safeSummary": "Student-facing components must pass UX, safety, and projection review and are never fully autogenerated.",
        "diffSummary": [
            "No Student Web component scaffold generated.",
            "Only safe DTO metadata may be referenced after human review.",
        ],
        "artifactPaths": [],
        "traceId": "trc_generator_block_student_component_001",
    },
]


def _registry_resource(
    resource_id: str,
    label: str,
    kind: str,
    status_value: str,
    owner: str,
    safe_summary: str,
    visible_to: str,
    trace_id: str,
    *,
    audit_log_id: str | None = None,
    queue_job_id: str | None = None,
    agent_run_id: str | None = None,
    tool_call_id: str | None = None,
) -> dict[str, Any]:
    resource = {
        "resourceId": resource_id,
        "label": label,
        "kind": kind,
        "status": status_value,
        "owner": owner,
        "safeSummary": safe_summary,
        "visibleTo": visible_to,
        "traceId": trace_id,
        "mock": True,
    }
    if audit_log_id:
        resource["auditLogId"] = audit_log_id
    if queue_job_id:
        resource["queueJobId"] = queue_job_id
    if agent_run_id:
        resource["agentRunId"] = agent_run_id
    if tool_call_id:
        resource["toolCallId"] = tool_call_id
    return resource


FOUNDATION_REGISTRY_SECTIONS: list[dict[str, Any]] = [
    {
        "registryId": "organization",
        "label": "Organization / tenant registry",
        "category": "Platform Base",
        "status": "MOCK",
        "owner": "System admin",
        "safeMessage": "Demo tenant metadata and module flags only; no real school roster data is returned.",
        "traceId": "trc_registry_organization_001",
        "resources": [
            _registry_resource(
                "tenant_org_demo",
                "org_demo tenant",
                "tenant",
                "MOCK",
                "System admin",
                "Mock tenant for competition/demo mode with mock data retention enabled.",
                "foundation",
                "trc_tenant_registry_001",
            ),
            _registry_resource(
                "module_surface_boundary",
                "Surface boundary flags",
                "module_policy",
                "PASS",
                "Platform engineer",
                "Student, Admin, and Foundation modules have separate route/API ownership.",
                "foundation",
                "trc_module_registry_001",
                audit_log_id="audit_log_module_boundary_001",
            ),
        ],
    },
    {
        "registryId": "identity",
        "label": "Identity / role / scope registry",
        "category": "Platform Base",
        "status": "PASS",
        "owner": "System admin",
        "safeMessage": "Role and class-scope fixtures return role names, scope ids, and safe denial messages only.",
        "traceId": "trc_registry_identity_001",
        "resources": [
            _registry_resource(
                "role_student",
                "Student safe projection role",
                "role",
                "PASS",
                "System admin",
                "Own student-safe views only; no ReviewCase or other-student data access.",
                "foundation/admin",
                "trc_role_registry_student_001",
            ),
            _registry_resource(
                "role_teacher",
                "Teacher class-scoped role",
                "role",
                "PASS",
                "System admin",
                "Assigned class access only; unassigned class probes are denied safely.",
                "foundation/admin",
                "trc_role_registry_teacher_001",
                audit_log_id="audit_log_role_teacher_001",
            ),
            _registry_resource(
                "role_service_job",
                "Trusted service job role",
                "role",
                "WARN",
                "Trusted worker",
                "Bypass behavior requires request_id, trace_id, job_id, and audit log linkage.",
                "server-only",
                "trc_role_registry_service_job_001",
                queue_job_id="job_service_role_fixture_001",
            ),
        ],
    },
    {
        "registryId": "database",
        "label": "Supabase / schema registry",
        "category": "Platform Base",
        "status": "WARN",
        "owner": "Platform engineer",
        "safeMessage": "Schema, migration, and pgvector readiness are reported without returning connection strings.",
        "traceId": "trc_registry_database_001",
        "resources": [
            _registry_resource(
                "supabase_project",
                "Supabase project binding",
                "database_project",
                "WARN",
                "Platform engineer",
                "Project URL and region are known; direct DB URL remains server-only.",
                "server-only",
                "trc_registry_supabase_project_001",
            ),
            _registry_resource(
                "schema_versions",
                "schema_versions table",
                "table",
                "WARN",
                "Platform engineer",
                "Tracks migration compatibility and checksums for platform foundation changes.",
                "foundation",
                "trc_registry_schema_versions_001",
            ),
            _registry_resource(
                "rag_vector_contract",
                "rag_chunks.embedding vector(1024)",
                "index_contract",
                "PASS",
                "Platform engineer",
                "Embedding dimension contract matches text-embedding-3-large at 1024 dimensions.",
                "server-only",
                "trc_registry_vector_contract_001",
            ),
        ],
    },
    {
        "registryId": "storage",
        "label": "Storage bucket registry",
        "category": "Platform Base",
        "status": "PASS",
        "owner": "Platform engineer",
        "safeMessage": "Bucket names, private policy expectations, and retention class are visible; object keys are not.",
        "traceId": "trc_registry_storage_001",
        "resources": [
            _registry_resource(
                "bucket_student_media",
                "student-media",
                "storage_bucket",
                "PASS",
                "Platform engineer",
                "Private task uploads; signed access must be short-lived and audited.",
                "server-only",
                "trc_registry_bucket_student_media_001",
                audit_log_id="audit_log_bucket_student_media_001",
            ),
            _registry_resource(
                "bucket_rag_source_docs",
                "rag-source-docs",
                "storage_bucket",
                "PASS",
                "Research/system",
                "Private source documents for textbooks, task banks, graph data, and teacher rules.",
                "server-only",
                "trc_registry_bucket_rag_source_docs_001",
            ),
            _registry_resource(
                "bucket_generated_feedback",
                "generated-feedback",
                "storage_bucket",
                "WARN",
                "Trusted worker",
                "Safe generated artifacts only; mock retention cleanup is expected.",
                "server-only",
                "trc_registry_bucket_generated_feedback_001",
                queue_job_id="job_cleanup_mock_001",
            ),
            _registry_resource(
                "bucket_prototype_exports",
                "prototype-exports",
                "storage_bucket",
                "PASS",
                "System admin",
                "Private export area; reason and audit metadata required.",
                "foundation",
                "trc_registry_bucket_prototype_exports_001",
            ),
        ],
    },
    {
        "registryId": "rag",
        "label": "RAG source / vector registry",
        "category": "RAG, Agents, Tools",
        "status": "WARN",
        "owner": "Research/system",
        "safeMessage": "Source metadata, ingestion state, vector contract, and citation policy are visible without raw chunks.",
        "traceId": "trc_registry_rag_001",
        "resources": [
            _registry_resource(
                "rag_source_textbook",
                "Textbook source class",
                "rag_source",
                "MOCK",
                "Curriculum researcher",
                "Registered source metadata; raw source text and chunks remain internal.",
                "foundation/admin",
                "trc_registry_rag_textbook_001",
                queue_job_id="job_rag_doc_001",
            ),
            _registry_resource(
                "rag_source_task_bank",
                "Task bank source class",
                "rag_source",
                "MOCK",
                "Curriculum researcher",
                "Task metadata can be indexed; answer keys and rubrics remain hidden from students.",
                "foundation/admin",
                "trc_registry_rag_task_bank_001",
            ),
            _registry_resource(
                "rag_retrieval_tool",
                "Citation-safe retrieval contract",
                "rag_contract",
                "PASS",
                "Research/system",
                "Retrieval outputs must include citation ids and student-safe summaries only.",
                "server-only",
                "trc_registry_rag_retrieval_001",
                tool_call_id="tool_rag_search_mock_001",
            ),
        ],
    },
    {
        "registryId": "agents",
        "label": "Agent workflow registry",
        "category": "RAG, Agents, Tools",
        "status": "WARN",
        "owner": "System admin",
        "safeMessage": "Workflow names, model bindings, and guardrails are visible; prompts and hidden reasoning are not returned.",
        "traceId": "trc_registry_agents_001",
        "resources": [
            _registry_resource(
                "workflow_recommend_path",
                "recommend_path",
                "agent_workflow",
                "WARN",
                "English teacher",
                "Path recommendation workflow creates teacher-reviewable candidates by default.",
                "server-only",
                "trc_registry_agent_recommend_path_001",
                agent_run_id="agent_run_recommend_path_mock_001",
            ),
            _registry_resource(
                "workflow_grade_objective_task",
                "grade_objective_task",
                "agent_workflow",
                "MOCK",
                "Student API/worker",
                "Deterministic checker preferred; model reasoning remains backend-only when needed.",
                "server-only",
                "trc_registry_agent_grade_objective_001",
            ),
            _registry_resource(
                "workflow_transcribe_speaking",
                "transcribe_speaking",
                "agent_workflow",
                "NOT_CONFIGURED",
                "Trusted worker",
                "Requires backend OpenAI key and queue execution before live use.",
                "server-only",
                "trc_registry_agent_transcribe_001",
            ),
        ],
    },
    {
        "registryId": "tools",
        "label": "Tool / connector registry",
        "category": "RAG, Agents, Tools",
        "status": "PASS",
        "owner": "Platform engineer",
        "safeMessage": "Tool schema refs, secret binding names, retry policy, and audit level are listed without raw secrets.",
        "traceId": "trc_registry_tools_001",
        "resources": [
            _registry_resource(
                "tool_rag_search",
                "rag_search",
                "tool",
                "WARN",
                "Foundation/worker",
                "Vector DB/internal API tool; raw chunks are never student-visible.",
                "server-only",
                "trc_registry_tool_rag_search_001",
                tool_call_id="tool_rag_search_mock_001",
            ),
            _registry_resource(
                "tool_transcribe_audio",
                "transcribe_audio",
                "tool",
                "NOT_CONFIGURED",
                "Trusted worker",
                "Speech-to-text tool waits for backend OpenAI secret binding.",
                "server-only",
                "trc_registry_tool_transcribe_audio_001",
            ),
            _registry_resource(
                "tool_audit_log_writer",
                "audit_log_writer",
                "tool",
                "PASS",
                "Trusted server",
                "Trusted server-only audit writer; browser invocation is denied.",
                "server-only",
                "trc_registry_tool_audit_log_writer_001",
                audit_log_id="audit_log_tool_registry_001",
            ),
        ],
    },
    {
        "registryId": "jobs",
        "label": "Queue / job registry",
        "category": "RAG, Agents, Tools",
        "status": "MOCK",
        "owner": "Trusted worker",
        "safeMessage": "Queue backend, job states, idempotency, and dead-letter metadata are visible without payloads.",
        "traceId": "trc_registry_jobs_001",
        "resources": [
            _registry_resource(
                "queue_backend",
                "BackgroundTasks / Redis adapter",
                "queue_backend",
                "MOCK",
                "Platform engineer",
                "Local MVP can use BackgroundTasks; Redis/Celery becomes active when REDIS_URL is present.",
                "server-only",
                "trc_registry_queue_backend_001",
            ),
            _registry_resource(
                "job_rag_doc_001",
                "RAG document ingestion",
                "queue_job",
                "MOCK",
                "Trusted worker",
                "Mock parse/chunk/embed pipeline with idempotency expected.",
                "foundation",
                "trc_registry_job_rag_doc_001",
                queue_job_id="job_rag_doc_001",
            ),
            _registry_resource(
                "job_cleanup_mock_001",
                "7-day mock cleanup",
                "queue_job",
                "WARN",
                "Trusted worker",
                "Mock student artifacts and generated feedback require retention cleanup.",
                "foundation",
                "trc_registry_job_cleanup_001",
                queue_job_id="job_cleanup_mock_001",
            ),
        ],
    },
    {
        "registryId": "lms",
        "label": "LMS connector registry",
        "category": "RAG, Agents, Tools",
        "status": "MOCK",
        "owner": "MockLmsAdapter",
        "safeMessage": "Mock adapter keeps OAuth client-credentials shape while real vendor credentials are absent.",
        "traceId": "trc_registry_lms_001",
        "resources": [
            _registry_resource(
                "lms_mock_adapter",
                "MockLmsAdapter",
                "lms_adapter",
                "MOCK",
                "System admin",
                "OAuth-compatible mock adapter for roster, path, submission, and grade sync contracts.",
                "server-only",
                "trc_registry_lms_mock_adapter_001",
            ),
            _registry_resource(
                "lms_client_credentials",
                "OAuth client credentials binding",
                "secret_binding",
                "MOCK",
                "LMS vendor/admin",
                "Binding names are tracked; client secret and webhook secret values are never returned.",
                "server-only",
                "trc_registry_lms_client_credentials_001",
            ),
            _registry_resource(
                "lms_path_publish_sync",
                "Path publish sync",
                "integration_job",
                "WARN",
                "MockLmsAdapter",
                "Queued retry state cannot publish an unpublished AdaptLearn path.",
                "server-only",
                "trc_registry_lms_path_publish_sync_001",
                queue_job_id="job_lms_sync_mock_001",
            ),
        ],
    },
    {
        "registryId": "audit",
        "label": "Audit / trace registry",
        "category": "Governance",
        "status": "PASS",
        "owner": "Compliance reviewer",
        "safeMessage": "Trace, audit, job, agent, and tool ids are searchable without raw sensitive payloads.",
        "traceId": "trc_registry_audit_001",
        "resources": [
            _registry_resource(
                "audit_log_foundation_reads",
                "Foundation readiness reads",
                "audit_stream",
                "PASS",
                "Compliance reviewer",
                "Every foundation readiness endpoint writes trace/audit metadata in mock mode.",
                "foundation",
                "trc_registry_audit_foundation_reads_001",
                audit_log_id="audit_log_foundation_reads_001",
            ),
            _registry_resource(
                "audit_log_tool_calls",
                "Agent/tool call linkage",
                "audit_stream",
                "PASS",
                "Compliance reviewer",
                "External tool calls must be traceable through agent_run_id and tool_call_id.",
                "foundation",
                "trc_registry_audit_tool_calls_001",
                tool_call_id="tool_call_audit_fixture_001",
            ),
            _registry_resource(
                "audit_export_controls",
                "Export controls",
                "governance_policy",
                "WARN",
                "System admin",
                "Export actions require reason, trace_id, and audit id before producing evidence bundles.",
                "foundation",
                "trc_registry_audit_export_controls_001",
            ),
        ],
    },
    {
        "registryId": "environment",
        "label": "Environment / secret binding registry",
        "category": "Governance",
        "status": "WARN",
        "owner": "Platform engineer",
        "safeMessage": "Required binding names are listed with present/missing status only; values are never returned.",
        "traceId": "trc_registry_environment_001",
        "resources": [
            _registry_resource(
                "env_supabase_server_secret",
                "Supabase server secret binding",
                "secret_binding",
                "WARN",
                "Trusted server",
                "Backend-only Supabase secret or service-role binding.",
                "server-only",
                "trc_registry_env_supabase_secret_001",
            ),
            _registry_resource(
                "env_openai_api_key",
                "OpenAI API key binding",
                "secret_binding",
                "NOT_CONFIGURED",
                "Trusted worker",
                "Backend-only model, embedding, and transcription adapter key.",
                "server-only",
                "trc_registry_env_openai_key_001",
            ),
            _registry_resource(
                "env_redis_url",
                "Redis URL binding",
                "secret_binding",
                "NOT_CONFIGURED",
                "Trusted worker",
                "Backend-only queue broker connection string.",
                "server-only",
                "trc_registry_env_redis_url_001",
            ),
        ],
    },
    {
        "registryId": "health",
        "label": "System health registry",
        "category": "Governance",
        "status": "WARN",
        "owner": "Platform engineer",
        "safeMessage": "Service health is reported as safe status labels; no live secret-bearing probes are exposed to the browser.",
        "traceId": "trc_registry_health_001",
        "resources": [
            _registry_resource(
                "health_fastapi",
                "FastAPI readiness surface",
                "service_health",
                "PASS",
                "Platform engineer",
                "Health/readiness endpoints return safe mock data and audit metadata.",
                "foundation",
                "trc_registry_health_fastapi_001",
            ),
            _registry_resource(
                "health_openai",
                "OpenAI adapter",
                "service_health",
                "NOT_CONFIGURED",
                "Trusted worker",
                "Mock adapter is active until backend OpenAI key is configured.",
                "server-only",
                "trc_registry_health_openai_001",
            ),
            _registry_resource(
                "health_lms",
                "LMS adapter",
                "service_health",
                "MOCK",
                "MockLmsAdapter",
                "MockLmsAdapter is active until vendor OAuth credentials are configured.",
                "server-only",
                "trc_registry_health_lms_001",
            ),
        ],
    },
    {
        "registryId": "generator",
        "label": "Generated CRUD governance registry",
        "category": "Governance",
        "status": "WARN",
        "owner": "Platform engineer",
        "safeMessage": "Generated CRUD is dry-run only until human review approves low-risk metadata surfaces.",
        "traceId": "trc_registry_generator_001",
        "resources": [
            _registry_resource(
                "generator_low_risk_metadata",
                "Low-risk metadata generation",
                "generator_policy",
                "WARN",
                "Platform engineer",
                "system_settings, environment_checks, and schema_versions can be scaffolded after review.",
                "foundation",
                "trc_registry_generator_low_risk_001",
                audit_log_id="audit_log_generator_policy_001",
            ),
            _registry_resource(
                "generator_student_surface_block",
                "Student surface generation block",
                "generator_policy",
                "PASS",
                "Compliance reviewer",
                "Student-facing components are blocked from full autogeneration.",
                "foundation",
                "trc_registry_generator_student_block_001",
            ),
        ],
    },
]


def list_foundation_pages() -> list[dict[str, str]]:
    return deepcopy(FOUNDATION_PAGES)


def foundation_registries(settings: Settings) -> dict[str, Any]:
    sections = deepcopy(FOUNDATION_REGISTRY_SECTIONS)
    _apply_runtime_registry_statuses(sections, settings)
    resources = [resource for section in sections for resource in section["resources"]]
    return {
        "mock": True,
        "simulationNotice": MOCK_SIMULATION_NOTICE,
        "sections": sections,
        "summary": {
            "sectionCount": len(sections),
            "resourceCount": len(resources),
            "passCount": _status_count(resources, "PASS"),
            "warnCount": _status_count(resources, "WARN"),
            "mockCount": _status_count(resources, "MOCK"),
            "notConfiguredCount": _status_count(resources, "NOT_CONFIGURED"),
            "blockedCount": _status_count(resources, "BLOCKED"),
        },
        "secretValuesReturned": False,
        "rawStudentDataReturned": False,
        "safeMessage": "Registry endpoints return resource names, ownership, safe summaries, and trace ids only.",
    }


def get_foundation_registry(registry_id: str, settings: Settings) -> dict[str, Any]:
    registries = foundation_registries(settings)
    registry = next((item for item in registries["sections"] if item["registryId"] == registry_id), None)
    if not registry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foundation registry not found")
    return {
        "mock": True,
        "simulationNotice": MOCK_SIMULATION_NOTICE,
        **registry,
        "secretValuesReturned": False,
        "rawStudentDataReturned": False,
    }


def get_foundation_page(page_id: str) -> dict[str, Any]:
    page = next((item for item in FOUNDATION_PAGES if item["pageId"] == page_id), None)
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foundation page not found")
    return {
        **deepcopy(page),
        "mock": True,
        "simulationNotice": MOCK_SIMULATION_NOTICE,
        "requiredTraceFields": ["trace_id", "audit_log_id", "queue_job_id", "agent_run_id", "tool_call_id"],
        "boundaryRules": [
            "Foundation cannot bypass teacher/expert decisions.",
            "Foundation cannot publish REVIEW/BLOCK objects to Student Web.",
            "Browser clients cannot perform service-role behavior.",
            "Student output uses safe projections only.",
        ],
        "safeWarnings": [
            "No real Supabase/OpenAI/LMS calls are made by this readiness endpoint.",
            "Server-only secrets are represented by binding names and status only.",
        ],
    }


def foundation_overview(settings: Settings) -> dict[str, Any]:
    return {
        "mock": True,
        "simulationNotice": MOCK_SIMULATION_NOTICE,
        "routeRoot": "/foundation",
        "surface": "Foundational Console",
        "mode": "mock/dev",
        "region": settings.supabase_region,
        "storageBuckets": ["student-media", "rag-source-docs", "generated-feedback", "prototype-exports"],
        "mockRetentionDays": settings.mock_data_retention_days,
        "pageCount": len(FOUNDATION_PAGES),
        "pages": list_foundation_pages(),
        "runtimeCounts": {
            "agentRuns": len(store.agent_runs),
            "toolCalls": len(store.tool_calls),
            "queueJobs": len(store.queue_jobs),
            "auditLogs": len(store.audit_logs),
            "ragDocuments": len(store.rag_documents),
            "ragChunks": len(store.rag_chunks),
            "lmsSyncStatuses": len(store.lms_sync_statuses),
        },
        "boundaries": [
            "Not Student Web.",
            "Not Admin Web business decision UI.",
            "No service-role secret in browser.",
            "No direct publish of REVIEW/BLOCK objects to students.",
        ],
    }


def environment_checks(settings: Settings) -> dict[str, Any]:
    checks = [
        _env_check(
            "NEXT_PUBLIC_SUPABASE_URL",
            "PASS" if settings.supabase_url else "NOT_CONFIGURED",
            "Browser-safe Supabase URL is known.",
            frontend_safe=True,
        ),
        _env_check(
            "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
            "WARN" if not settings.supabase_publishable_key else "PASS",
            "Publishable browser key is optional for mock mode and required before real auth.",
            frontend_safe=True,
        ),
        _env_check(
            "SUPABASE_SECRET_KEY",
            "NOT_CONFIGURED" if not settings.supabase_secret_key else "PASS",
            "Server-only Supabase secret binding is not exposed.",
            server_only=True,
        ),
        _env_check(
            "SUPABASE_DB_URL",
            "NOT_CONFIGURED" if not settings.supabase_db_url else "PASS",
            "Direct database URL is server-only and needed for migrations/live checks.",
            server_only=True,
        ),
        _env_check(
            "SUPABASE_ENABLE_PGVECTOR",
            "PASS" if settings.supabase_enable_pgvector else "WARN",
            "pgvector is expected for rag_chunks.embedding vector(1024).",
            server_only=True,
        ),
        _env_check(
            "OPENAI_API_KEY",
            "NOT_CONFIGURED" if not settings.openai_api_key else "PASS",
            "OpenAI key remains backend-only; mock adapter is active when absent.",
            server_only=True,
        ),
        _env_check(
            "OPENAI_EMBEDDING_DIMENSIONS",
            "PASS" if settings.openai_embedding_dimensions == 1024 else "WARN",
            "Embedding dimensions should be 1024 for text-embedding-3-large.",
            server_only=True,
        ),
        _env_check(
            "REDIS_URL",
            "NOT_CONFIGURED" if not settings.redis_url else "PASS",
            "Celery/Redis production queue is optional for local MVP.",
            server_only=True,
        ),
        _env_check(
            "LMS_CLIENT_SECRET",
            "MOCK" if not settings.lms_client_secret else "PASS",
            "MockLmsAdapter is active until real OAuth credentials exist.",
            server_only=True,
        ),
    ]
    return {
        "mock": True,
        "simulationNotice": MOCK_SIMULATION_NOTICE,
        "checks": checks,
        "secretValuesReturned": False,
        "browserServiceRoleExposure": "PASS",
        "safeMessage": "Readiness checks return present/missing status only; no raw secret values are included.",
    }


def rls_test_results() -> dict[str, Any]:
    tests = [
        _rls_test("student", "own student-safe projection", "PASS", True, "Student reads own safe views only."),
        _rls_test("student", "ReviewCase detail read", "PASS", False, "ReviewCase details are blocked from students."),
        _rls_test("teacher", "assigned class diagnosis read", "PASS", True, "Assigned class fixture is allowed."),
        _rls_test("teacher", "unassigned class read", "PASS", False, "Unassigned class access is denied safely."),
        _rls_test(
            "curriculum_researcher",
            "unrestricted student submissions",
            "PASS",
            False,
            "Researcher cannot browse unrestricted student submissions.",
        ),
        _rls_test("expert", "assigned high-risk ReviewCase", "PASS", True, "Expert scope is limited to assigned/high-risk cases."),
        _rls_test("admin", "silent path publish override", "PASS", False, "Admin cannot silently override teacher path decisions."),
        _rls_test("browser", "service-role-only RPC", "PASS", False, "Browser clients cannot invoke service-role behavior."),
        _rls_test("service_job", "trusted worker bypass", "WARN", True, "Allowed only with job_id, request_id, trace_id, and audit."),
    ]
    return {
        "mock": True,
        "simulationNotice": MOCK_SIMULATION_NOTICE,
        "runner": "mock_rls_policy_runner",
        "tests": tests,
        "safeDiagnosticsOnly": True,
    }


def student_safe_preview() -> dict[str, Any]:
    return {
        "mock": True,
        "simulationNotice": MOCK_SIMULATION_NOTICE,
        "projection": "student_learning_path_view",
        "safeOutput": deepcopy(SAFE_PREVIEW_OUTPUT),
        "blockedFieldTokens": FORBIDDEN_STUDENT_FIELD_TOKENS,
        "safeMessage": "The safeOutput object excludes internal governance, scoring, model, and audit fields.",
    }


def generator_dry_run_preview() -> dict[str, Any]:
    return {
        "mock": True,
        "simulationNotice": MOCK_SIMULATION_NOTICE,
        "mode": "dry_run",
        "dryRunId": "dryrun_generated_crud_mock_001",
        "crudSpecId": "generated_crud_spec_mock_001",
        "status": "REVIEW_REQUIRED",
        "writeApplied": False,
        "fileWritesApplied": False,
        "databaseWritesApplied": False,
        "requiresHumanReview": True,
        "sourceKinds": ["supabase_schema", "fastapi_openapi", "zod_schema", "approved_metadata"],
        "guardrails": {
            "noSecretsInGeneratedCode": True,
            "noServiceRoleInBrowser": True,
            "noRawStudentData": True,
            "noStudentFacingAutogeneration": True,
            "teacherExpertDecisionBoundary": True,
            "rlsAndStoragePolicyRequireManualReview": True,
        },
        "summary": {
            "candidateCount": len(GENERATOR_DRY_RUN_CANDIDATES),
            "generatableCount": sum(1 for item in GENERATOR_DRY_RUN_CANDIDATES if item["status"] == "GENERATABLE"),
            "reviewRequiredCount": sum(1 for item in GENERATOR_DRY_RUN_CANDIDATES if item["reviewRequired"]),
            "blockedCount": sum(1 for item in GENERATOR_DRY_RUN_CANDIDATES if item["status"] == "BLOCKED"),
        },
        "candidates": deepcopy(GENERATOR_DRY_RUN_CANDIDATES),
        "safeWarnings": [
            "Dry-run preview only; no generated files, migrations, policies, or database rows are written.",
            "Low-risk metadata candidates still require reviewer approval before use.",
            "Student-facing components and governed business objects are blocked from full autogeneration.",
        ],
    }


def _apply_runtime_registry_statuses(sections: list[dict[str, Any]], settings: Settings) -> None:
    by_id = {section["registryId"]: section for section in sections}

    database = by_id.get("database")
    if database:
        database_ready = bool(settings.supabase_db_url and settings.supabase_secret_key)
        database["status"] = "PASS" if database_ready else "WARN"
        _set_resource_status(database, "supabase_project", "PASS" if database_ready else "WARN")

    environment = by_id.get("environment")
    if environment:
        _set_resource_status(environment, "env_supabase_server_secret", "PASS" if settings.supabase_secret_key else "WARN")
        _set_resource_status(environment, "env_openai_api_key", "PASS" if settings.openai_api_key else "NOT_CONFIGURED")
        _set_resource_status(environment, "env_redis_url", "PASS" if settings.redis_url else "NOT_CONFIGURED")
        environment["status"] = "PASS" if settings.supabase_secret_key and settings.openai_api_key and settings.redis_url else "WARN"

    agents = by_id.get("agents")
    if agents:
        _set_resource_status(agents, "workflow_transcribe_speaking", "PASS" if settings.openai_api_key else "NOT_CONFIGURED")
        agents["status"] = "PASS" if settings.openai_api_key else "WARN"

    tools = by_id.get("tools")
    if tools:
        _set_resource_status(tools, "tool_transcribe_audio", "PASS" if settings.openai_api_key else "NOT_CONFIGURED")

    jobs = by_id.get("jobs")
    if jobs:
        queue_status = "PASS" if settings.redis_url else "MOCK"
        jobs["status"] = queue_status
        _set_resource_status(jobs, "queue_backend", queue_status)

    lms = by_id.get("lms")
    if lms:
        lms_ready = bool(settings.lms_base_url and settings.lms_client_id and settings.lms_client_secret and settings.lms_token_url)
        lms_status = "PASS" if lms_ready else "MOCK"
        lms["status"] = lms_status
        _set_resource_status(lms, "lms_mock_adapter", "WARN" if lms_ready else "MOCK")
        _set_resource_status(lms, "lms_client_credentials", lms_status)

    health = by_id.get("health")
    if health:
        _set_resource_status(health, "health_openai", "PASS" if settings.openai_api_key else "NOT_CONFIGURED")
        _set_resource_status(health, "health_lms", "PASS" if settings.lms_client_secret else "MOCK")
        health["status"] = "PASS" if settings.openai_api_key and settings.lms_client_secret else "WARN"


def _set_resource_status(section: dict[str, Any], resource_id: str, status_value: str) -> None:
    resource = next((item for item in section["resources"] if item["resourceId"] == resource_id), None)
    if resource:
        resource["status"] = status_value


def _status_count(resources: list[dict[str, Any]], status_value: str) -> int:
    return sum(1 for resource in resources if resource["status"] == status_value)


def _env_check(
    name: str,
    status_value: str,
    safe_message: str,
    *,
    frontend_safe: bool = False,
    server_only: bool = False,
) -> dict[str, Any]:
    return {
        "checkId": f"env_{name.lower()}",
        "name": name,
        "status": status_value,
        "safeMessage": safe_message,
        "frontendSafe": frontend_safe,
        "serverOnly": server_only,
        "valueReturned": False,
        "mock": True,
    }


def _rls_test(actor_role: str, scenario: str, status_value: str, allowed: bool, safe_message: str) -> dict[str, Any]:
    return {
        "testId": f"rls_{actor_role}_{scenario.lower().replace(' ', '_').replace('-', '_')}",
        "actorRole": actor_role,
        "scenario": scenario,
        "status": status_value,
        "allowed": allowed,
        "safeMessage": safe_message,
        "traceId": f"trc_mock_{actor_role}_{'allow' if allowed else 'deny'}",
        "rawPayloadReturned": False,
    }
