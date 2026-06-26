import { MOCK_SIMULATION_NOTICE } from "@adaptlearn/shared";

export type FoundationStatus = "PASS" | "WARN" | "BLOCKED" | "MOCK" | "NOT_CONFIGURED";
export type FoundationTone = "good" | "warn" | "bad" | "info" | "mock";

export type FoundationPageId =
  | "overview"
  | "organization"
  | "users"
  | "database"
  | "rls"
  | "storage"
  | "rag-sources"
  | "rag-indexes"
  | "agent-workflows"
  | "tools"
  | "jobs"
  | "lms"
  | "audit"
  | "environment"
  | "health"
  | "generator";

export type FoundationNavItem = {
  id: FoundationPageId;
  href: string;
  label: string;
  icon: string;
};

export type FoundationMetric = {
  label: string;
  value: string;
  detail: string;
  tone: FoundationTone;
  traceId: string;
};

export type FoundationCheck = {
  label: string;
  status: FoundationStatus;
  safeMessage: string;
  traceId: string;
  auditLogId?: string;
  queueJobId?: string;
  mock: boolean;
};

export type FoundationRegistryRow = {
  id: string;
  label: string;
  status: FoundationStatus;
  owner: string;
  summary: string;
  traceId: string;
  auditLogId?: string;
  queueJobId?: string;
  agentRunId?: string;
  toolCallId?: string;
  mock: boolean;
};

export type FoundationBoundary = {
  title: string;
  message: string;
  tone: FoundationTone;
};

export type FoundationPage = FoundationNavItem & {
  purpose: string;
  mockNotice: typeof MOCK_SIMULATION_NOTICE;
  primaryTraceId: string;
  metrics: FoundationMetric[];
  checks: FoundationCheck[];
  rows: FoundationRegistryRow[];
  boundaries: FoundationBoundary[];
};

export const foundationNavGroups: Array<{ label: string; items: FoundationNavItem[] }> = [
  {
    label: "Platform Base",
    items: [
      { id: "overview", href: "/foundation", label: "System Overview", icon: "activity" },
      { id: "organization", href: "/foundation/organization", label: "Organization & Tenant Settings", icon: "building" },
      { id: "users", href: "/foundation/users", label: "User / Role / Class Scope Management", icon: "users" },
      { id: "database", href: "/foundation/database", label: "Supabase / Database Health", icon: "database" },
      { id: "rls", href: "/foundation/rls", label: "RLS Policy Viewer / Test Runner", icon: "shield" },
      { id: "storage", href: "/foundation/storage", label: "Storage Bucket Manager", icon: "storage" },
    ],
  },
  {
    label: "RAG, Agents, Tools",
    items: [
      { id: "rag-sources", href: "/foundation/rag/sources", label: "RAG Source Manager", icon: "file-search" },
      { id: "rag-indexes", href: "/foundation/rag/indexes", label: "Embedding / Vector Index Monitor", icon: "network" },
      { id: "agent-workflows", href: "/foundation/agents/workflows", label: "Agent Workflow Registry", icon: "workflow" },
      { id: "tools", href: "/foundation/tools", label: "Tool / MCP / API Connector Registry", icon: "plug" },
      { id: "jobs", href: "/foundation/jobs", label: "Queue / Job Monitor", icon: "list-checks" },
      { id: "lms", href: "/foundation/lms", label: "LMS Connector Settings", icon: "graduation" },
    ],
  },
  {
    label: "Governance",
    items: [
      { id: "audit", href: "/foundation/audit", label: "Audit Log Explorer", icon: "scroll" },
      { id: "environment", href: "/foundation/environment", label: "Environment & Secrets Checklist", icon: "key" },
      { id: "health", href: "/foundation/health", label: "System Health / Monitoring", icon: "heart" },
      { id: "generator", href: "/foundation/generator", label: "Schema / CRUD Generator Console", icon: "wand" },
    ],
  },
];

const commonBoundaries: FoundationBoundary[] = [
  {
    title: "Teacher and expert decisions stay governed",
    message:
      "Foundation may inspect workflow status and trace links, but it cannot approve paths, resolve ReviewCase decisions, or publish REVIEW/BLOCK objects to Student Web.",
    tone: "warn",
  },
  {
    title: "Student-safe projection only",
    message:
      "Student Web receives safe DTO fields only. DecisionTrace records, raw BKT/IRT values, internal citation deliberation, rule weights, teacher-only notes, and support audit logs remain hidden.",
    tone: "good",
  },
  {
    title: "Server-only service role",
    message:
      "Service-role behavior is represented as trusted FastAPI/worker mock checks. Browser pages never hold service-role secret values or call service-role-only RPCs.",
    tone: "good",
  },
];

const makeMetric = (label: string, value: string, detail: string, tone: FoundationTone, traceId: string): FoundationMetric => ({
  label,
  value,
  detail,
  tone,
  traceId,
});

const makeCheck = (
  label: string,
  status: FoundationStatus,
  safeMessage: string,
  traceId: string,
  mock = true,
  auditLogId?: string,
  queueJobId?: string,
): FoundationCheck => ({
  label,
  status,
  safeMessage,
  traceId,
  auditLogId,
  queueJobId,
  mock,
});

const makeRow = (
  id: string,
  label: string,
  status: FoundationStatus,
  owner: string,
  summary: string,
  traceId: string,
  refs: Partial<Pick<FoundationRegistryRow, "auditLogId" | "queueJobId" | "agentRunId" | "toolCallId">> = {},
): FoundationRegistryRow => ({
  id,
  label,
  status,
  owner,
  summary,
  traceId,
  mock: true,
  ...refs,
});

export const foundationPages: FoundationPage[] = [
  {
    ...foundationNavGroups[0].items[0],
    purpose:
      "Entry dashboard for tenant, environment, database, queue, storage, RAG, agents, audit, safe projection, and health readiness.",
    mockNotice: MOCK_SIMULATION_NOTICE,
    primaryTraceId: "trc_foundation_overview_mock_001",
    metrics: [
      makeMetric("Mode", "Mock/dev", "No real minors, Supabase, OpenAI, LMS, or Redis calls are made.", "mock", "trc_env_mock_001"),
      makeMetric("Region", "ap-northeast-1", "Configured Supabase project region label.", "info", "trc_supabase_region_001"),
      makeMetric("Storage", "4 buckets", "student-media, rag-source-docs, generated-feedback, prototype-exports.", "good", "trc_storage_mock_001"),
      makeMetric("Retention", "7 days", "Mock student artifacts and logs expire unless exported.", "warn", "trc_retention_001"),
    ],
    checks: [
      makeCheck("Student-safe projection preview", "PASS", "Only safe labels, ids, statuses, and next action are shown.", "trc_safe_projection_001", true, "aud_safe_projection_001"),
      makeCheck("Service-role browser separation", "PASS", "Browser-visible config contains no server secret values.", "trc_service_role_001", true, "aud_env_browser_001"),
      makeCheck("Review/block publish guard", "PASS", "Foundation shows blocked state only; business publish stays in Admin Web.", "trc_boundary_001", true, "aud_boundary_001"),
      makeCheck("Mock data flag", "MOCK", "Every page carries explicit prototype/mock status.", "trc_mock_flag_001"),
    ],
    rows: [
      makeRow("sys_supabase", "Supabase foundation", "MOCK", "Platform engineer", "Project URL and region are known; live health is not called.", "trc_supabase_mock_001"),
      makeRow("sys_rag", "RAG corpus foundation", "WARN", "Research/system", "Sources are registered as mock rows; embeddings are not generated yet.", "trc_rag_mock_001", { queueJobId: "job_rag_ingest_mock_001" }),
      makeRow("sys_agents", "Agent workflow observability", "MOCK", "System admin", "Workflow registry shows server-side contracts and guardrail expectations.", "trc_agent_registry_001", { agentRunId: "agr_registry_mock_001" }),
      makeRow("sys_audit", "Audit and trace coverage", "PASS", "Compliance reviewer", "Trace, audit, job, agent, and tool ids are displayed as secondary metadata.", "trc_audit_mock_001", { auditLogId: "aud_overview_001" }),
    ],
    boundaries: commonBoundaries,
  },
  {
    ...foundationNavGroups[0].items[1],
    purpose: "Manage organization metadata, tenant flags, enabled modules, region labels, environment readiness, and mock-mode flags.",
    mockNotice: MOCK_SIMULATION_NOTICE,
    primaryTraceId: "trc_org_mock_001",
    metrics: [
      makeMetric("Organization", "org_adaptlearn_demo", "Demo tenant metadata only.", "mock", "trc_org_demo_001"),
      makeMetric("Enabled modules", "Student, Admin, Foundation", "Surface ownership is separated by route and API namespace.", "good", "trc_modules_001"),
      makeMetric("Region label", "ap-northeast-1", "Matches confirmed Supabase region.", "info", "trc_region_001"),
    ],
    checks: [
      makeCheck("Tenant mock flag", "MOCK", "Demo tenant is visibly marked as mock/dev.", "trc_tenant_mock_001", true, "aud_tenant_001"),
      makeCheck("Platform settings write policy", "WARN", "Write action skeleton requires reason, trace_id, and audit log.", "trc_settings_policy_001"),
      makeCheck("Real minor data gate", "PASS", "No production student data is enabled.", "trc_minor_data_gate_001"),
    ],
    rows: [
      makeRow("setting_mock_mode", "system_settings.mock_mode", "MOCK", "System admin", "Mock mode is enabled and visible in UI/audit.", "trc_setting_mock_001", { auditLogId: "aud_setting_mock_001" }),
      makeRow("setting_retention", "mock_retention_days", "WARN", "Compliance reviewer", "7-day cleanup expected for mock student artifacts/logs.", "trc_setting_retention_001"),
      makeRow("setting_low_risk_auto_delivery", "low-risk auto-delivery flag", "NOT_CONFIGURED", "System admin", "Not enabled; teacher publish remains required.", "trc_auto_delivery_001"),
    ],
    boundaries: commonBoundaries,
  },
  {
    ...foundationNavGroups[0].items[2],
    purpose: "Inspect user profiles, role assignments, class memberships, active scopes, and permission diagnostics.",
    mockNotice: MOCK_SIMULATION_NOTICE,
    primaryTraceId: "trc_users_mock_001",
    metrics: [
      makeMetric("Profiles", "5 mock users", "Student, teacher, researcher, expert, and system admin personas.", "mock", "trc_profiles_001"),
      makeMetric("Class scopes", "1 demo class", "Teacher access is limited to assigned class fixtures.", "good", "trc_class_scope_001"),
      makeMetric("Active sessions", "2 staff contexts", "Server-validated session state is represented as mock metadata.", "mock", "trc_sessions_001"),
    ],
    checks: [
      makeCheck("Teacher assigned class access", "PASS", "Assigned class fixture resolves; unassigned fixture is denied.", "trc_teacher_scope_001", true, "aud_scope_test_001"),
      makeCheck("Expert review scope", "PASS", "Expert can inspect assigned/high-risk cases only in mock diagnostics.", "trc_expert_scope_001"),
      makeCheck("Missing scope message", "PASS", "Denied states use safe messages without object-existence leakage.", "trc_missing_scope_001"),
    ],
    rows: [
      makeRow("role_teacher", "English teacher role assignment", "PASS", "System admin", "Bound to demo class scope and reason metadata.", "trc_role_teacher_001", { auditLogId: "aud_role_teacher_001" }),
      makeRow("role_researcher", "Curriculum researcher role assignment", "PASS", "System admin", "Content/RAG scope only; broad student submission reads blocked.", "trc_role_researcher_001"),
      makeRow("role_admin", "System admin operational scope", "WARN", "System admin", "Can configure platform foundation; cannot override teacher/expert conclusions.", "trc_role_admin_001"),
    ],
    boundaries: commonBoundaries,
  },
  {
    ...foundationNavGroups[0].items[3],
    purpose: "Inspect Supabase project, region, pgvector readiness, migrations, schema versions, indexes, and connection health.",
    mockNotice: MOCK_SIMULATION_NOTICE,
    primaryTraceId: "trc_database_mock_001",
    metrics: [
      makeMetric("Project URL", "aiczvdicexzwvkqpqncu", "Hostname only; no keys are embedded.", "info", "trc_db_project_001"),
      makeMetric("pgvector", "Expected", "Extension readiness is mocked until credentials exist.", "mock", "trc_pgvector_001"),
      makeMetric("Migration", "202606260001", "Initial student/foundation table migration detected in repo.", "good", "trc_migration_001"),
    ],
    checks: [
      makeCheck("Schema version table", "WARN", "schema_versions table is listed as additive foundation infrastructure.", "trc_schema_version_001"),
      makeCheck("Vector dimension contract", "PASS", "RAG chunks expect vector(1024).", "trc_vector_dim_001"),
      makeCheck("Connection health", "MOCK", "Live Supabase connection is not attempted in MVP.", "trc_db_connection_001"),
    ],
    rows: [
      makeRow("table_schema_versions", "schema_versions", "WARN", "Platform engineer", "Tracks migration compatibility and checksums.", "trc_table_schema_versions_001"),
      makeRow("table_environment_checks", "environment_checks", "MOCK", "Platform engineer", "Stores safe readiness messages and trace ids.", "trc_table_env_checks_001"),
      makeRow("index_rag_chunks", "rag_chunks vector index", "NOT_CONFIGURED", "Platform engineer", "HNSW/IVFFlat index deferred until real data volume exists.", "trc_index_rag_001"),
    ],
    boundaries: commonBoundaries,
  },
  {
    ...foundationNavGroups[0].items[4],
    purpose: "View policy matrix, run scoped role tests, validate helper functions, and check browser/service-role separation.",
    mockNotice: MOCK_SIMULATION_NOTICE,
    primaryTraceId: "trc_rls_mock_001",
    metrics: [
      makeMetric("Latest run", "6 roles", "Student, teacher, researcher, expert, admin, and service job fixtures.", "good", "trc_rls_run_001"),
      makeMetric("Negative tests", "4 denied", "Unassigned class, cross-student, browser service action, and blocked publish.", "good", "trc_rls_negative_001"),
      makeMetric("Helper functions", "Planned", "SQL helpers are represented as expected names until DB is connected.", "mock", "trc_rls_helpers_001"),
    ],
    checks: [
      makeCheck("Student owner safe view", "PASS", "Student fixture reads own safe projection only.", "trc_rls_student_001", true, "aud_rls_student_001"),
      makeCheck("Teacher assigned class", "PASS", "Assigned class succeeds; unassigned class denied safely.", "trc_rls_teacher_001", true, "aud_rls_teacher_001"),
      makeCheck("Browser service action", "PASS", "Service-role-only write is denied from browser fixture.", "trc_rls_service_browser_001", true, "aud_rls_service_001"),
      makeCheck("Review/block guard", "PASS", "Blocked source cannot publish, recommend, or update student-visible state.", "trc_rls_review_block_001"),
    ],
    rows: [
      makeRow("rls_student_owner", "student_owner_safe_projection", "PASS", "Platform engineer", "Own path/task/submission/profile safe views only.", "trc_rls_student_row_001"),
      makeRow("rls_teacher_scope", "teacher_assigned_class_policy", "PASS", "Platform engineer", "Allows assigned class; denies unassigned class.", "trc_rls_teacher_row_001"),
      makeRow("rls_service_job", "service_job_bypass_policy", "WARN", "Trusted worker", "Bypass allowed only with job_id, trace_id, request_id, and audit.", "trc_rls_service_job_001", { queueJobId: "job_rls_mock_001" }),
    ],
    boundaries: commonBoundaries,
  },
  {
    ...foundationNavGroups[0].items[5],
    purpose: "Configure buckets, policies, signed URL checks, MIME allowlists, max size, retention jobs, and cleanup status.",
    mockNotice: MOCK_SIMULATION_NOTICE,
    primaryTraceId: "trc_storage_mock_001",
    metrics: [
      makeMetric("Buckets", "4 private", "All configured as private in the mock registry.", "good", "trc_buckets_001"),
      makeMetric("Signed URLs", "Required", "Creation must be audited and short-lived.", "warn", "trc_signed_urls_001"),
      makeMetric("Cleanup", "7-day mock", "Student artifacts and generated feedback expire.", "warn", "trc_storage_cleanup_001"),
    ],
    checks: [
      makeCheck("student-media private", "PASS", "No public raw student media exposure.", "trc_bucket_student_media_001"),
      makeCheck("rag-source-docs private", "PASS", "Source access requires scoped worker/staff path.", "trc_bucket_rag_001"),
      makeCheck("generated-feedback private", "PASS", "Student reads safe artifacts through signed access only.", "trc_bucket_feedback_001"),
      makeCheck("prototype-exports private default", "PASS", "Export reason required for sensitive mock artifacts.", "trc_bucket_exports_001"),
    ],
    rows: [
      makeRow("bucket_student_media", "student-media", "PASS", "Platform engineer", "Audio/image/video task uploads; 120-second task cap.", "trc_bucket_row_001", { auditLogId: "aud_signed_url_001" }),
      makeRow("bucket_rag_source_docs", "rag-source-docs", "PASS", "Research/system", "教材、题库、知识图谱、教师规则文档 source storage.", "trc_bucket_row_002"),
      makeRow("bucket_generated_feedback", "generated-feedback", "WARN", "System worker", "Safe feedback artifacts only; cleanup job expected.", "trc_bucket_row_003", { queueJobId: "job_cleanup_mock_001" }),
      makeRow("bucket_prototype_exports", "prototype-exports", "PASS", "System admin", "Demo export area, private by default.", "trc_bucket_row_004"),
    ],
    boundaries: commonBoundaries,
  },
  {
    ...foundationNavGroups[1].items[0],
    purpose: "Register source documents, inspect ingestion state, metadata, parsing, chunking, OCR/table extraction, and retention.",
    mockNotice: MOCK_SIMULATION_NOTICE,
    primaryTraceId: "trc_rag_sources_mock_001",
    metrics: [
      makeMetric("Source classes", "4", "Textbook, task bank, knowledge graph, and teacher rules docs.", "good", "trc_rag_source_classes_001"),
      makeMetric("Ingestion", "Mock queued", "No live parser, OCR, or embedding call is made.", "mock", "trc_rag_ingestion_001"),
      makeMetric("Citations", "Required", "Every retrieval result must carry citation ids.", "good", "trc_rag_citation_policy_001"),
    ],
    checks: [
      makeCheck("Metadata registration", "PASS", "Source type, version, permission, and retention class are tracked.", "trc_rag_metadata_001"),
      makeCheck("Mock student data retention", "WARN", "Any source containing mock student artifacts inherits 7-day cleanup.", "trc_rag_retention_001"),
      makeCheck("Student source summary boundary", "PASS", "Student output can show safe source summaries only.", "trc_rag_safe_summary_001"),
    ],
    rows: [
      makeRow("rag_doc_textbook", "Unit 6 textbook packet", "MOCK", "Curriculum researcher", "Registered source metadata; parsing deferred.", "trc_rag_doc_001", { queueJobId: "job_rag_doc_001" }),
      makeRow("rag_doc_task_bank", "Unit 6 task bank", "MOCK", "Curriculum researcher", "Structured task rows plus source chunk references.", "trc_rag_doc_002"),
      makeRow("rag_doc_knowledge_graph", "Unit 6 knowledge graph JSON", "PASS", "Research/system", "Seed graph can be referenced for source metadata.", "trc_rag_doc_003"),
      makeRow("rag_doc_teacher_rules", "Teacher rule document set", "WARN", "Teacher/researcher", "Teacher-facing source, not student-visible raw text.", "trc_rag_doc_004"),
    ],
    boundaries: commonBoundaries,
  },
  {
    ...foundationNavGroups[1].items[1],
    purpose: "Track embedding model, dimensions, vector counts, index state, citation coverage, and retrieval health.",
    mockNotice: MOCK_SIMULATION_NOTICE,
    primaryTraceId: "trc_rag_indexes_mock_001",
    metrics: [
      makeMetric("Embedding model", "text-embedding-3-large", "Configured production recommendation.", "info", "trc_embedding_model_001"),
      makeMetric("Dimensions", "1024", "Expected rag_chunks.embedding vector(1024).", "good", "trc_embedding_dim_001"),
      makeMetric("Vector count", "0 live", "Mock monitor only; no OpenAI call is made.", "mock", "trc_vector_count_001"),
    ],
    checks: [
      makeCheck("Index readiness", "WARN", "Vector index should be built after sufficient data volume.", "trc_index_ready_001"),
      makeCheck("Citation coverage", "PASS", "Mock retrieval rows include citation id placeholders.", "trc_citation_coverage_001"),
      makeCheck("Student RAG projection", "PASS", "Raw chunks and internal deliberation are excluded from safe output.", "trc_rag_projection_001"),
    ],
    rows: [
      makeRow("rag_chunk_vector_contract", "rag_chunks.embedding", "PASS", "Platform engineer", "vector(1024) contract shown for pgvector.", "trc_vector_contract_001"),
      makeRow("rag_index_hnsw", "HNSW index candidate", "NOT_CONFIGURED", "Platform engineer", "Deferred until real corpus size and DB access exist.", "trc_hnsw_001"),
      makeRow("rag_retrieval_health", "Retrieval health sample", "MOCK", "Research/system", "Mock top_k coverage and citation ids only.", "trc_retrieval_health_001", { toolCallId: "tool_rag_search_mock_001" }),
    ],
    boundaries: commonBoundaries,
  },
  {
    ...foundationNavGroups[1].items[2],
    purpose: "Manage workflow definitions, model versions, prompt versions, guardrails, safe-output rules, and run observability.",
    mockNotice: MOCK_SIMULATION_NOTICE,
    primaryTraceId: "trc_agent_workflows_mock_001",
    metrics: [
      makeMetric("Workflows", "10 registered", "Spec 16 workflow contracts represented as mock rows.", "mock", "trc_workflow_count_001"),
      makeMetric("Main model", "gpt-5.5", "Server-side agent model plan only.", "info", "trc_agent_model_001"),
      makeMetric("Guardrail mode", "Review/block", "REVIEW or BLOCK creates a governed case.", "good", "trc_guardrail_001"),
    ],
    checks: [
      makeCheck("Server-side agent rule", "PASS", "Agents are registered as backend/worker-only.", "trc_agent_server_001"),
      makeCheck("Safe-output projection", "PASS", "Student-facing text must pass safe projection before delivery.", "trc_agent_safe_output_001"),
      makeCheck("Human decision boundary", "PASS", "Agents cannot make final teacher path or expert research decisions.", "trc_agent_human_boundary_001"),
    ],
    rows: [
      makeRow("workflow_recommend_path", "recommend_path", "WARN", "English teacher", "Candidate path workflow; teacher review required by default.", "trc_workflow_001", { agentRunId: "agr_recommend_path_mock_001" }),
      makeRow("workflow_grade_objective", "grade_objective_task", "MOCK", "Student API/worker", "Deterministic checker preferred; model only when rubric reasoning is needed.", "trc_workflow_002"),
      makeRow("workflow_transcribe", "transcribe_speaking", "NOT_CONFIGURED", "Trusted worker", "OpenAI transcription waits for backend key and queue.", "trc_workflow_003"),
      makeRow("workflow_lms_sync", "lms_sync", "MOCK", "System admin", "MockLmsAdapter shape retained for OAuth client credentials later.", "trc_workflow_004", { queueJobId: "job_lms_sync_mock_001" }),
    ],
    boundaries: commonBoundaries,
  },
  {
    ...foundationNavGroups[1].items[3],
    purpose: "Register tool schemas, secret bindings, allowed workflows, retry/timeout policy, audit level, and student visibility.",
    mockNotice: MOCK_SIMULATION_NOTICE,
    primaryTraceId: "trc_tool_registry_mock_001",
    metrics: [
      makeMetric("Tools", "13 defaults", "Initial internal/API/OpenAI/LMS tool catalog from specs.", "mock", "trc_tool_count_001"),
      makeMetric("Write tools", "trace_id required", "Write-capable tools require trace metadata.", "good", "trc_tool_write_rule_001"),
      makeMetric("Secrets", "Server binding names", "No raw secret values are rendered.", "good", "trc_tool_secret_binding_001"),
    ],
    checks: [
      makeCheck("Tool schema versioning", "PASS", "Input/output schema refs are versioned in registry rows.", "trc_tool_schema_001"),
      makeCheck("Student visibility rule", "PASS", "Raw tool output cannot flow to Student Web without projection.", "trc_tool_student_visible_001"),
      makeCheck("Retry and timeout policy", "WARN", "Policies are mocked until worker runtime is connected.", "trc_tool_retry_001"),
    ],
    rows: [
      makeRow("tool_rag_search", "rag_search", "WARN", "Foundation/worker", "Vector DB/internal API; raw chunks are staff/internal only.", "trc_tool_rag_001", { toolCallId: "tool_rag_search_mock_001" }),
      makeRow("tool_transcribe_audio", "transcribe_audio", "NOT_CONFIGURED", "Trusted worker", "Requires backend OpenAI secret binding later.", "trc_tool_transcribe_001"),
      makeRow("tool_review_case_creator", "review_case_creator", "PASS", "Governance/system", "Creates governed case records for REVIEW/BLOCK states.", "trc_tool_review_case_001"),
      makeRow("tool_audit_log_writer", "audit_log_writer", "PASS", "Trusted server", "Trusted RPC/API only; no browser invocation.", "trc_tool_audit_001", { auditLogId: "aud_tool_registry_001" }),
    ],
    boundaries: commonBoundaries,
  },
  {
    ...foundationNavGroups[1].items[4],
    purpose: "Inspect Celery/Redis or BackgroundTasks adapter jobs, retries, dead letters, idempotency, and audit links.",
    mockNotice: MOCK_SIMULATION_NOTICE,
    primaryTraceId: "trc_jobs_mock_001",
    metrics: [
      makeMetric("Backend", "BackgroundTasks MVP", "Celery/Redis preferred later; local adapter allowed now.", "mock", "trc_queue_backend_001"),
      makeMetric("Retry states", "8", "QUEUED, RUNNING, SUCCEEDED, RETRY_WAITING, FAILED, DEAD_LETTER, CANCELLED, COMPENSATED.", "info", "trc_queue_states_001"),
      makeMetric("Dead letters", "1 mock", "Business-blocking failures link to governed handling.", "warn", "trc_dead_letter_001"),
    ],
    checks: [
      makeCheck("Idempotency coverage", "PASS", "Submissions, LMS sync, RAG ingestion, generated CRUD jobs require keys.", "trc_idempotency_001"),
      makeCheck("Audit transitions", "PASS", "Each async state change has trace/audit metadata in mock rows.", "trc_queue_audit_001"),
      makeCheck("No external queue probe", "MOCK", "Redis/Celery is not contacted in MVP.", "trc_queue_no_probe_001"),
    ],
    rows: [
      makeRow("job_rag_doc_001", "RAG document ingestion", "MOCK", "Trusted worker", "Queued mock parse/chunk/embed pipeline.", "trc_job_rag_001", { queueJobId: "job_rag_doc_001" }),
      makeRow("job_lms_sync_mock_001", "LMS path publish sync", "WARN", "MockLmsAdapter", "Retry waiting mock state; does not change path deliverability.", "trc_job_lms_001", { queueJobId: "job_lms_sync_mock_001" }),
      makeRow("job_cleanup_mock_001", "7-day mock cleanup", "WARN", "System worker", "Retention cleanup expected for mock student artifacts/logs.", "trc_job_cleanup_001", { queueJobId: "job_cleanup_mock_001" }),
    ],
    boundaries: commonBoundaries,
  },
  {
    ...foundationNavGroups[1].items[5],
    purpose: "Configure MockLmsAdapter, OAuth placeholders, scopes, roster/path/submission sync, retry, and failures.",
    mockNotice: MOCK_SIMULATION_NOTICE,
    primaryTraceId: "trc_lms_mock_001",
    metrics: [
      makeMetric("Adapter", "MockLmsAdapter", "No real LMS credentials are configured.", "mock", "trc_lms_adapter_001"),
      makeMetric("OAuth shape", "client credentials", "Interface is preserved for later real adapter.", "info", "trc_lms_oauth_001"),
      makeMetric("Scopes", "5 planned", "classes:read, assignments:write, submissions:write, grades:write, users:read.", "warn", "trc_lms_scopes_001"),
    ],
    checks: [
      makeCheck("Roster sync", "MOCK", "Mock class roster sync state only.", "trc_lms_roster_001"),
      makeCheck("Path publish sync", "PASS", "LMS status cannot publish an unpublished AdaptLearn path.", "trc_lms_path_publish_001"),
      makeCheck("Submission result sync", "WARN", "Safe summary only; no hidden rubrics or internal evidence.", "trc_lms_submission_001"),
    ],
    rows: [
      makeRow("lms_roster", "Class roster sync", "MOCK", "MockLmsAdapter", "LMS -> AdaptLearn class/student mappings are demo-only.", "trc_lms_row_001"),
      makeRow("lms_path_publish", "Path publish sync", "WARN", "MockLmsAdapter", "Queued retry state; local deliverability remains governed.", "trc_lms_row_002", { queueJobId: "job_lms_sync_mock_001" }),
      makeRow("lms_feedback_summary", "Feedback summary sync", "MOCK", "MockLmsAdapter", "Safe feedback summary and review flag only.", "trc_lms_row_003"),
    ],
    boundaries: commonBoundaries,
  },
  {
    ...foundationNavGroups[2].items[0],
    purpose: "Search audit logs, agent/tool traces, exported evidence, retention status, and trace-linked records.",
    mockNotice: MOCK_SIMULATION_NOTICE,
    primaryTraceId: "trc_audit_mock_001",
    metrics: [
      makeMetric("Audit rows", "12 mock", "Auth-sensitive reads, writes, RLS runs, signed URL checks, and generator actions.", "mock", "trc_audit_rows_001"),
      makeMetric("Trace coverage", "100% mock", "Every displayed row includes trace_id metadata.", "good", "trc_trace_coverage_001"),
      makeMetric("Retention", "7-day mock", "Mock logs expire unless explicitly exported.", "warn", "trc_audit_retention_001"),
    ],
    checks: [
      makeCheck("Sensitive payload refs", "PASS", "Mock audit rows store payload references, not raw responses or secrets.", "trc_audit_payload_refs_001"),
      makeCheck("Export controls", "WARN", "Export action skeleton requires reason and audit id.", "trc_audit_export_001"),
      makeCheck("Service job writes", "PASS", "Service job mock rows include job_id and trace_id.", "trc_audit_service_job_001"),
    ],
    rows: [
      makeRow("aud_env_browser_001", "Environment browser exposure check", "PASS", "Platform engineer", "Confirms no raw server secret values in browser page.", "trc_audit_env_001", { auditLogId: "aud_env_browser_001" }),
      makeRow("aud_rls_teacher_001", "Teacher class scope RLS run", "PASS", "Platform engineer", "Assigned/unassigned fixture results captured.", "trc_audit_rls_001", { auditLogId: "aud_rls_teacher_001" }),
      makeRow("aud_signed_url_001", "Signed URL policy check", "PASS", "Storage worker", "Signed URL creation is audit-covered in mock registry.", "trc_audit_storage_001", { auditLogId: "aud_signed_url_001" }),
    ],
    boundaries: commonBoundaries,
  },
  {
    ...foundationNavGroups[2].items[1],
    purpose: "Check required env vars and ensure server-only secrets are not exposed to the browser.",
    mockNotice: MOCK_SIMULATION_NOTICE,
    primaryTraceId: "trc_environment_mock_001",
    metrics: [
      makeMetric("Frontend vars", "Partial", "NEXT_PUBLIC_SUPABASE_URL expected; publishable key not read live.", "warn", "trc_frontend_env_001"),
      makeMetric("Server vars", "Not loaded", "Backend-only secrets are represented by safe binding names only.", "mock", "trc_server_env_001"),
      makeMetric("Exposure scan", "Pass", "No secret values are rendered in the client bundle by this page.", "good", "trc_exposure_scan_001"),
    ],
    checks: [
      makeCheck("Supabase URL", "PASS", "Confirmed project URL is known; no live request is made.", "trc_env_supabase_url_001"),
      makeCheck("Supabase secret binding", "WARN", "Server-only binding must be configured in backend/deploy secrets later.", "trc_env_supabase_secret_001"),
      makeCheck("OpenAI API key binding", "NOT_CONFIGURED", "OpenAI work remains backend-only and disabled for MVP.", "trc_env_openai_001"),
      makeCheck("Redis URL", "NOT_CONFIGURED", "Celery/Redis production queue is not connected.", "trc_env_redis_001"),
      makeCheck("LMS credentials", "MOCK", "MockLmsAdapter is active; real OAuth credentials are absent.", "trc_env_lms_001"),
    ],
    rows: [
      makeRow("env_next_public_supabase_url", "NEXT_PUBLIC_SUPABASE_URL", "PASS", "Frontend", "Browser-safe URL only.", "trc_env_row_001"),
      makeRow("env_supabase_server_secret", "Server Supabase secret binding", "WARN", "Trusted server", "Backend/deploy secret only; never render raw value.", "trc_env_row_002"),
      makeRow("env_openai_key", "OpenAI server key binding", "NOT_CONFIGURED", "Trusted worker", "No OpenAI calls until backend secret exists.", "trc_env_row_003"),
      makeRow("env_lms_mock", "LMS mock adapter mode", "MOCK", "System admin", "Uses mock adapter with OAuth-compatible interface.", "trc_env_row_004"),
    ],
    boundaries: commonBoundaries,
  },
  {
    ...foundationNavGroups[2].items[2],
    purpose: "Monitor service health, storage/RAG/queue/LMS/OpenAI status, alerts, cleanup jobs, and triage links.",
    mockNotice: MOCK_SIMULATION_NOTICE,
    primaryTraceId: "trc_health_mock_001",
    metrics: [
      makeMetric("API", "Mock-ready", "FastAPI skeleton is present; no live health probe from browser.", "mock", "trc_health_api_001"),
      makeMetric("OpenAI", "Disabled", "No API key or model calls are used in MVP.", "warn", "trc_health_openai_001"),
      makeMetric("Cleanup jobs", "Expected", "Mock retention job rows are visible in queue monitor.", "warn", "trc_health_cleanup_001"),
    ],
    checks: [
      makeCheck("Frontend route health", "PASS", "/foundation renders without Student API dependency.", "trc_health_frontend_001"),
      makeCheck("Queue adapter health", "MOCK", "BackgroundTasks adapter represented only.", "trc_health_queue_001"),
      makeCheck("Monitoring safe messages", "PASS", "Alerts avoid raw payloads and secret values.", "trc_health_safe_messages_001"),
    ],
    rows: [
      makeRow("health_frontend", "Next.js Foundation route", "PASS", "Frontend", "Static/mock route can render independently.", "trc_health_row_001"),
      makeRow("health_rag", "RAG ingestion pipeline", "WARN", "Research/system", "No parser/embedder connected yet.", "trc_health_row_002", { queueJobId: "job_rag_doc_001" }),
      makeRow("health_lms", "LMS adapter", "MOCK", "MockLmsAdapter", "OAuth shape ready, real credentials absent.", "trc_health_row_003"),
      makeRow("health_openai", "OpenAI adapter", "NOT_CONFIGURED", "Trusted worker", "Backend-only model calls disabled.", "trc_health_row_004"),
    ],
    boundaries: commonBoundaries,
  },
  {
    ...foundationNavGroups[2].items[3],
    purpose: "Generate, review, diff, risk-label, and approve low-risk CRUD specs and admin/foundation forms.",
    mockNotice: MOCK_SIMULATION_NOTICE,
    primaryTraceId: "trc_generator_mock_001",
    metrics: [
      makeMetric("Generated specs", "3 mock", "Low-risk system metadata only.", "mock", "trc_generator_specs_001"),
      makeMetric("Risk review", "Required", "RLS, storage, tools, agents, and student-facing components require human review.", "warn", "trc_generator_risk_001"),
      makeMetric("Output location", "Planned", "apps/foundation-console/src/generated or apps/web generated metadata later.", "info", "trc_generator_output_001"),
    ],
    checks: [
      makeCheck("Low-risk CRUD only", "PASS", "system_settings, environment_checks, schema_versions are allowed candidates.", "trc_generator_low_risk_001"),
      makeCheck("Governed workflow exclusion", "PASS", "Learner, submission, path, review, and decision CRUD stays hand-authored/governed.", "trc_generator_exclusion_001"),
      makeCheck("Secret scanning", "PASS", "Generated specs cannot contain secret values or raw student data.", "trc_generator_secret_scan_001"),
    ],
    rows: [
      makeRow("crud_system_settings", "system_settings form spec", "MOCK", "Platform engineer", "Low-risk settings metadata with audit requirement.", "trc_crud_001", { auditLogId: "aud_generator_001" }),
      makeRow("crud_environment_checks", "environment_checks table spec", "MOCK", "Platform engineer", "Readiness rows with safe_message and trace_id.", "trc_crud_002"),
      makeRow("crud_rag_documents", "rag_documents source metadata", "WARN", "Research/system", "Requires retention and permission review before write actions.", "trc_crud_003", { queueJobId: "job_crud_mock_001" }),
    ],
    boundaries: commonBoundaries,
  },
];

export const foundationPagesById = new Map(foundationPages.map((page) => [page.id, page]));
export const foundationPagesByHref = new Map(foundationPages.map((page) => [page.href, page]));

export const studentSafeProjectionPreview = {
  mock: true,
  simulationNotice: MOCK_SIMULATION_NOTICE,
  traceId: "trc_student_safe_projection_preview_001",
  fields: [
    { label: "learner_id", value: "learner_demo_001" },
    { label: "path_id", value: "PTH01" },
    { label: "path_version", value: "3" },
    { label: "task_id", value: "UI01" },
    { label: "safe_status", value: "deliverable" },
    { label: "student_text", value: "Practice plant part words before photosynthesis." },
    { label: "safe_reason_chip", value: "Vocabulary focus" },
    { label: "next_action", value: "Start task" },
  ],
};

export const studentForbiddenFieldTokens = [
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
] as const;

export function getFoundationPageByHref(href: string): FoundationPage | undefined {
  return foundationPagesByHref.get(href);
}

export function getFoundationPageBySlug(section?: string[]): FoundationPage | undefined {
  if (!section || section.length === 0) {
    return foundationPagesById.get("overview");
  }
  return getFoundationPageByHref(`/foundation/${section.join("/")}`);
}
