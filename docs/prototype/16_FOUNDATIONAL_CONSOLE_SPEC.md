# 16 Foundational Console Spec

## 1. Purpose

This document defines the AdaptLearn Foundational Console: the platform-base control console that supports Student Web, Admin Web, FastAPI jobs, agent workflows, RAG, LMS sync, Supabase schema/RLS, audit, monitoring, and generated CRUD.

The Foundational Console is not Student Web and is not Admin Web. It does not implement student learning screens, teacher diagnosis screens, learning path review screens, content authoring screens, annotation review screens, ReviewCase business decisions, or research evidence decisions already defined in `15_ADMIN_WEB_PRODUCTION_SPEC.md`. It exists to configure, inspect, test, and govern the shared system foundation those surfaces depend on.

Confirmed platform configuration:

| Area | Decision |
|---|---|
| Supabase URL | `https://aiczvdicexzwvkqpqncu.supabase.co` |
| Supabase region | `ap-northeast-1` |
| Storage buckets | `student-media`, `rag-source-docs`, `generated-feedback`, `prototype-exports` |
| Database | Supabase Postgres + pgvector |
| Frontend | Next.js + React |
| Backend | FastAPI |
| Auth | Supabase Auth email/password first; SSO/school account later |
| OpenAI main model | `gpt-5.5` |
| Embeddings | `text-embedding-3-large`, `dimensions=1024` |
| Speech-to-text | `gpt-4o-mini-transcribe` |
| Queue | Celery/Redis preferred; FastAPI BackgroundTasks adapter allowed for MVP |
| Deployment | Local Docker + Vercel frontend + FastAPI hosting + Supabase Cloud |
| Data | Mock only for now; no real minors |
| Mock retention | 7 days for mock student artifacts/logs unless explicitly exported |
| RAG corpus | 教材、题库、知识图谱、教师规则文档都可入库 |
| LMS | Start with `MockLmsAdapter`; keep OAuth 2.0 client credentials interface |

## 2. Positioning And Boundaries

### 2.1 Foundational Console Responsibilities

The Foundational Console manages system-level foundation:

| Area | Responsibility |
|---|---|
| Organization and tenant | Organization records, tenant settings, enabled modules, region metadata, environment readiness |
| User, role, and scope | User profile binding, role assignments, class-scope mapping, active scope diagnostics |
| Supabase/database | Database health, pgvector readiness, migration status, schema versions, generated CRUD specs |
| RLS | Policy viewer, scoped test runner, helper-function diagnostics, browser/service-role separation checks |
| Storage | Bucket configuration, access policy, signed URL checks, retention jobs, mock artifact cleanup |
| RAG | Source registration, ingestion state, chunk/embedding/index monitoring, citation policy |
| Agents | Workflow registry, prompt/model versions, agent run records, guardrail status, safe-output checks |
| Tools | MCP/API tool registry, tool schema validation, secrets requirements, audit level, timeout/retry policy |
| Queue/jobs | Queue health, job state transitions, retry/dead-letter rules, idempotency, job audit |
| LMS connector | Mock LMS settings, OAuth 2.0 placeholders, roster/path/submission sync state and failures |
| Audit/compliance | Audit log coverage, trace explorer, retention checks, export controls, mock-data flags |
| Monitoring | System health, environment checks, service status, failure triage links |
| Generated CRUD | Schema/OpenAPI/Zod/Pydantic-driven table/form generation and review workflow |

### 2.2 Admin Web Responsibilities

Admin Web remains the governance and operations surface for learning business workflows:

- Content, source metadata, copyright, and version lifecycle.
- AI annotation review, taxonomy/knowledge graph management, course and task assembly.
- Student/class diagnosis for assigned teacher scopes.
- Learning path generation review, approval, modification, rejection, replanning, and publish.
- ReviewCase / Quality Queue decisions.
- Rules, teacher constraints, research evidence, and monitoring operation views.

Foundational Console must not duplicate these business pages. It may show system references, health summaries, schema metadata, workflow versions, and trace links, but substantive teacher/researcher/expert decisions happen in Admin Web governed workflows.

### 2.3 Student Web Responsibilities

Student Web consumes only student-safe projections:

- It reads only the student's own active published/deliverable path, task, feedback, progress, upload status, and profile summary.
- It submits only through API endpoints and must include `path_id`, `path_version`, `task_id`, `learner_id`, and `idempotency_key`.
- It does not access platform foundation, Admin internal tables, canonical diagnosis state, ReviewCase details, DecisionTrace records, rule weights, internal citations, or other student data.

### 2.4 Hard Boundary Rules

- Foundational Console cannot bypass Admin Web teacher/expert decision boundaries.
- Foundational Console system-level actions must not directly publish blocked/review objects to Student Web.
- Foundational Console must not turn a `ReviewCase`, `DecisionTrace`, raw model output, internal citation deliberation, or hidden rule score into student-visible content.
- Admins can configure systems, assign/reopen operational cases, and inspect traces, but cannot silently overwrite teacher path decisions or expert research conclusions.
- Service-role actions must run only through FastAPI workers/trusted server code and write `audit_logs`, `agent_runs`, `tool_calls`, `queue_jobs`, or `lms_sync_statuses` as applicable.

## 3. Alignment With Existing Specs

| Source | Required alignment |
|---|---|
| `13_STUDENT_WEB_SPEC.md` | Student reads only own effective published/safe projection. Submissions require `path_id`, `path_version`, `task_id`, `learner_id`, and `idempotency_key`. Student pages never expose internal rule weights, teacher audit records, ReviewCase details, raw BKT/IRT values, exact rankings, or other students. |
| `14_PRODUCTION_IMPLEMENTATION_SPEC.md` | Use Next.js + React, FastAPI, Supabase Postgres, Supabase Storage, pgvector, OpenAI, `MockLmsAdapter`, and Celery/Redis as production default. FastAPI BackgroundTasks can adapt the same job interface for local MVP. |
| `15_ADMIN_WEB_PRODUCTION_SPEC.md` | Preserve role boundaries, ReviewCase blocking semantics, DecisionTrace requirements, student-safe projections, teacher final path decision, expert final evidence decision, and service-role audit obligations. |
| `prototype/shared/src/schemas/core.ts` | Keep current shared schema shapes compatible. New foundational tables/views are additive production infrastructure unless later migrations intentionally version the shared schema. |

## 4. Information Architecture

Recommended route root:

| Route | Page | Primary roles | Purpose |
|---|---|---|---|
| `/foundation` | System Overview | System admin, platform engineer | Entry dashboard for tenant, environment, database, queue, storage, RAG, agents, audit, and health |
| `/foundation/organization` | Organization & Tenant Settings | System admin | Manage organization metadata, tenant flags, enabled modules, region labels, and mock-mode flags |
| `/foundation/users` | User / Role / Class Scope Management | System admin | Inspect `user_profiles`, role assignments, class memberships, and active scopes |
| `/foundation/database` | Supabase / Database Health | System admin, platform engineer | Inspect Supabase project, region, pgvector, migrations, schema versions, indexes, and connection health |
| `/foundation/rls` | RLS Policy Viewer / Test Runner | System admin, platform engineer | View policy matrix, run scoped role tests, validate helper functions, detect browser service-role exposure |
| `/foundation/storage` | Storage Bucket Manager | System admin, platform engineer | Configure buckets, policies, signed URL checks, max size, MIME allowlists, retention jobs |
| `/foundation/rag/sources` | RAG Source Manager | Curriculum researcher, system admin | Register source documents, inspect ingestion, metadata, parsing, chunking, retention |
| `/foundation/rag/indexes` | Embedding / Vector Index Monitor | System admin, platform engineer | Track embedding model/dimensions, vector counts, index state, citation coverage, retrieval health |
| `/foundation/agents/workflows` | Agent Workflow Registry | System admin, researcher lead | Manage workflow definitions, model versions, prompt versions, guardrails, safe-output rules |
| `/foundation/tools` | Tool / MCP / API Connector Registry | System admin, platform engineer | Register tool schemas, secrets, allowed workflows, retry/timeout, audit levels |
| `/foundation/jobs` | Queue / Job Monitor | System admin, platform engineer | Inspect Celery/Redis or BackgroundTasks adapter jobs, retries, dead letters, idempotency |
| `/foundation/lms` | LMS Connector Settings | System admin | Configure `MockLmsAdapter`, OAuth placeholders, scopes, roster/path/submission sync |
| `/foundation/audit` | Audit Log Explorer | System admin, compliance reviewer | Search audit logs, agent/tool traces, exported evidence, retention status |
| `/foundation/environment` | Environment & Secrets Checklist | System admin, platform engineer | Check required env vars and ensure server-only secrets are not exposed to browser |
| `/foundation/health` | System Health / Monitoring | System admin, platform engineer | Service health, storage/RAG/queue/LMS/OpenAI status, alerts, cleanup jobs |
| `/foundation/generator` | Schema / CRUD Generator Console | System admin, platform engineer | Generate, review, diff, and approve low-risk CRUD specs and admin forms |

### 4.1 Page Behavior Rules

- Pages use dense operational layouts: tables, filters, tabs, drawers, diff panels, status badges, and trace timelines.
- Object IDs may appear as copyable secondary metadata; primary labels should be human-readable when available.
- Every write action displays the resulting status, `trace_id`, and related `audit_log_id`, `queue_job_id`, `agent_run_id`, `tool_call_id`, or `review_case_id`.
- Permission-denied states must explain missing scope without leaking object existence across tenants.
- Dangerous operations require an explicit reason and must write audit logs.

## 5. Database And Schema Foundation

### 5.1 Shared Table Ownership

| Table group | Tables | Primary owner | Foundational Console responsibility |
|---|---|---|---|
| Tenant/auth scope | `organizations`, `classes`, `user_profiles`, `role_assignments`, `admin_sessions`, `class_memberships`, `students` | System admin / LMS sync | Manage metadata, scopes, user/profile binding, role assignment health, mock flags |
| Taxonomy | `knowledge_nodes`, `knowledge_edges`, `taxonomy_versions` | Curriculum researcher / expert | Show schema, version, reference counts, index health, RLS tests; business edits stay in Admin Web taxonomy workflows |
| Content/task | `content_versions`, `content_drafts`, `tasks`, `task_annotations`, `unit_packages` | Curriculum researcher | Track table health, version immutability checks, CRUD generation metadata; content decisions stay in Admin Web |
| Learner state | `learner_profiles`, `bkt_states`, `irt_states`, `bloom_profiles`, `thinking_profiles` | Diagnosis jobs / teacher governed workflow | Inspect schema and job health; no direct UI mutation of learner state |
| Learning flow | `learning_paths`, `path_steps`, `student_submissions`, `media_uploads` | Student API / teacher path workflow / jobs | Validate submission idempotency, storage references, stale path/version checks; no direct publish override |
| Governance | `review_cases`, `decision_traces` | Admin Web governed workflows | Monitor completeness and unresolved blockers; no silent decision edit |
| Rules/evidence | `rule_profiles`, `teacher_constraints`, `research_claims`, `evidence_sources`, `research_review_cases` | Teacher/researcher/expert/admin governed workflows | Track versions, release health, citation policy, schema metadata; decisions remain governed |
| LMS | `lms_sync_statuses`, `lms_dead_letters` | LMS sync jobs / admin monitoring | Configure connector, retry/dead-letter policy, operational status |
| RAG | `rag_documents`, `rag_chunks` | Researcher/admin ingestion jobs | Source metadata, ingestion status, chunk vectors, index health, citation coverage |
| Agents/tools/jobs/audit | `agent_runs`, `tool_calls`, `queue_jobs`, `trace_events`, `audit_logs` | Server workers / service role jobs | Registry, trace explorer, job monitor, audit coverage, cleanup |
| System generation | `system_settings`, `generated_crud_specs`, `schema_versions`, `environment_checks` | System admin / platform engineer | Manage platform flags, generation specs, schema diffs, env readiness |

### 5.2 Read/Write Boundaries By Actor

| Actor | Allowed | Not allowed |
|---|---|---|
| Student | Read own safe projections; write own submissions, media upload metadata, reflection through API with idempotency | Directly write projection views or canonical tables; read ReviewCase/DecisionTrace/internal citations/other students |
| English teacher | View assigned class diagnosis and evidence; review assigned paths/submissions/media; create ReviewCases; make path decisions with reason where required | Directly modify submission payloads or learner profile state; publish unresolved REVIEW/BLOCK; access unassigned classes |
| Curriculum researcher | Manage content, tasks, annotations, knowledge graph, and RAG sources in scope; view aggregate QA | Browse unrestricted student submissions; make final learner path decisions |
| Expert | Process assigned/high-risk cases, high-risk annotations, taxonomy changes, research claims, and evidence | Publish student paths; browse unrelated student data; release rule profiles as admin |
| System admin | Manage system configuration, roles, workflow versions, monitoring, dead letters, generated CRUD specs, audit visibility | Silently overwrite teacher/expert decisions; directly edit learner state; read raw student responses without scoped support policy |
| Foundational Console | Configure system base, run diagnostics, inspect traces, manage registry and schema generation | Replace Admin Web governed workflows for business conclusions |
| Service role | Run backend jobs, agents, ingestion, sync, cleanup, maintenance with `job_id`/`trace_id` | Run from browser; write without audit/agent/tool/queue records |

### 5.3 Additive Production Tables

The following production foundation tables are additive to existing shared schema contracts:

| Table | Purpose | Minimum fields |
|---|---|---|
| `schema_versions` | Track applied schema/migration versions and compatibility notes | `schema_version_id`, `version`, `source`, `status`, `applied_at`, `checksum`, `notes` |
| `generated_crud_specs` | Store generated CRUD/table/form specs before approval | `crud_spec_id`, `source_schema_ref`, `target_surface`, `status`, `risk_level`, `generated_by`, `reviewed_by`, `created_at`, `version` |
| `environment_checks` | Store env/secret/readiness check results | `check_id`, `environment`, `check_name`, `status`, `last_checked_at`, `safe_message`, `trace_id` |
| `system_settings` | Tenant/platform settings and feature flags | `setting_id`, `organization_id`, `key`, `value_ref`, `scope`, `updated_by`, `updated_at` |
| `tool_calls` | External/internal tool audit for each agent run | `tool_call_id`, `agent_run_id`, `tool_id`, `input_ref`, `output_ref`, `status`, `latency_ms`, `trace_id` |
| `queue_jobs` | App-level queue/job tracking independent of queue backend | `job_id`, `queue_name`, `workflow_type`, `object_type`, `object_id`, `status`, `retry_count`, `idempotency_key`, `trace_id` |
| `audit_logs` | Security/business audit events | `audit_log_id`, `actor_user_id`, `role`, `organization_id`, `action`, `object_type`, `object_id`, `request_id`, `trace_id`, `created_at` |

## 6. RLS And Permission Strategy

### 6.1 Principles

- RLS is enabled on all tenant, student, content, path, submission, RAG, agent, tool, queue, and audit tables unless a table is purely internal and reachable only through service-role RPC.
- Browser clients use publishable/anon credentials only and must never perform service-role behavior.
- Service-role bypass is limited to FastAPI trusted server code and workers. Each bypassed operation must include `job_id`, `trace_id`, `request_id`, `initiated_by`, object references, and audit records.
- Student-facing APIs prefer views/projections or FastAPI DTOs over direct canonical table reads.
- Policies should fail closed when active organization/role/class scope is missing.

### 6.2 Policy Matrix

| Scope | Policy idea |
|---|---|
| Student owner | `auth.uid()` maps through `user_profiles` to exactly one student/learner scope or an active student context. Student can read own safe views and own submission/upload status; writes go through API and idempotency. |
| Teacher assigned class | Teacher reads classes/students/submissions/media/diagnosis/path objects only when `class_memberships` grants assigned class scope. Teacher decisions require reason and DecisionTrace when action is modify/reject/replan/override. |
| Curriculum researcher content scope | Researcher can manage content/task/taxonomy/RAG objects in organization scope. Student evidence snippets require governed ReviewCase assignment and redaction. |
| Expert review-case scope | Expert can read/write only assigned or eligible high-risk cases and the minimum source snapshot required for decision. |
| Admin operational scope | Admin can manage organizations, roles, system settings, workflow versions, assignments, monitoring, and dead-letter state. Admin cannot silently mutate teacher/expert conclusions or learner profile state. |
| Service role job bypass | Trusted workers can bypass RLS only with `job_id`, `trace_id`, `workflow_type`, `initiated_by`, and audit/agent/tool/queue records. |

### 6.3 RLS Test Runner Requirements

The Foundational Console RLS runner must support:

- Impersonated role contexts for student, teacher, researcher, expert, admin, and service job.
- Organization and class-scope fixtures.
- Positive and negative tests for assigned vs unassigned class access.
- Student owner tests for path/task/submission/media/profile safe projections.
- Browser key tests that verify service-role-only RPCs fail.
- ReviewCase blocking tests for publish/recommend/update flows.
- Audit coverage tests for writes and auth-sensitive reads.

The test runner reports pass/fail and safe diagnostic messages; it must not print secret keys or raw student payloads.

## 7. Auth And Account System

| Area | Requirement |
|---|---|
| Primary auth | Supabase Auth email/password for first production skeleton |
| Future auth | SSO/school account via OIDC/SAML or LMS identity mapping |
| Profile binding | `user_profiles.auth_user_id` binds to `auth.uid()` and stores display label, organization, role defaults, mock/dev flags |
| Roles | `role_assignments` stores role, organization, class/review scope, status, effective dates, and grant reason |
| Active context | `admin_sessions` stores server-validated active organization, role, class scope, and review scope |
| Dev/mock users | Must be visibly flagged in UI and audit logs; mock users cannot be mistaken for real minors |
| Secrets | Secret/service keys never enter frontend bundles, browser logs, generated code, or client-side env vars |
| Service role | Only FastAPI workers/trusted server code can use service-role credentials |

Required account flow:

1. User signs in through Supabase Auth.
2. Backend maps `auth.uid()` to `user_profiles`.
3. Backend loads allowed `role_assignments`.
4. Staff users choose active organization/role/class/review scope.
5. Server validates route and action scope on every request.
6. Writes include `X-Request-Id`, `trace_id`, and idempotency key where applicable.

## 8. Storage Foundation

| Bucket | Purpose | Public? | Content types | Max size | Access policy | Signed URL | Retention |
|---|---|---:|---|---:|---|---|---|
| `student-media` | Student audio/image/video submissions | No | audio, image, video allowed by task policy | 120 sec audio/video task cap; tenant-configured byte cap | Student owner upload/read own status; teacher assigned class read evidence; service jobs process | Required for upload/download; short-lived | Mock student artifacts cleaned after 7 days |
| `rag-source-docs` | 教材、题库、知识图谱、教师规则文档 and other source documents | No | PDF, DOCX, XLSX, CSV, JSON, text, markdown, images if OCR needed | Project/tenant-configured | Researcher/admin manage; workers read for ingestion | Required for source access | Project-controlled; if it contains mock student data, apply 7-day cleanup |
| `generated-feedback` | Generated feedback/report artifacts and safe output files | No | JSON, markdown, PDF, audio/text artifacts where approved | Tenant-configured | Student owner reads safe artifacts only; teacher/admin scoped reads; workers write | Required | Mock student artifacts cleaned after 7 days |
| `prototype-exports` | Demo exports, screenshots, videos, generated reports | No by default | Images, video, PDF, JSON, CSV | Project-configured | Project-controlled access; export reason required for sensitive items | Required unless explicitly public export approved | Project-controlled; if it contains mock student artifacts, apply 7-day cleanup |

Storage manager requirements:

- Validate bucket exists, public/private setting, MIME allowlist, max-size policy, and signed URL expiration.
- Track object references in canonical tables instead of storing raw file URLs in student-facing payloads.
- Run cleanup jobs for 7-day mock artifacts.
- Audit signed URL creation for student/media/source artifacts.
- Prevent direct public exposure of raw student media or generated feedback.

## 9. RAG Foundation

### 9.1 Ingestion Pipeline

Required pipeline:

1. Source upload to `rag-source-docs`.
2. Source metadata registration in `rag_documents`.
3. Permission and retention classification.
4. Parsing and optional OCR/table extraction.
5. Chunking into stable `rag_chunks` with `source_ref`, page/row/span references, language, source type, and version.
6. Embedding with `text-embedding-3-large` and `dimensions=1024`.
7. Store embeddings in `rag_chunks.embedding vector(1024)`.
8. Build/update vector index after sufficient data volume.
9. Retrieval API returns ranked chunks with citation ids.
10. Agent output stores citation ids internally and creates student-safe summaries only when output is student-facing.

### 9.2 Projection Boundaries

| Projection | Allowed content |
|---|---|
| Teacher/admin internal RAG projection | Source metadata, citation ids, chunk refs, retrieved text snippets, confidence/coverage, internal deliberation where role permits |
| Student-safe projection | Age-appropriate source summaries, approved source labels, no internal citation deliberation, no restricted teacher notes, no hidden prompt/rule text |

Retrieval requirements:

- Every retrieval result includes citation ids.
- Agent answers must preserve citation ids in `agent_runs` / `tool_calls`.
- Student-facing output may display safe source summaries but must not expose internal deliberation or restricted source spans.
- RAG documents containing mock student data inherit 7-day mock retention.

## 10. Agent Workflow Registry

### 10.1 Common Rules

- Agents run server-side or in workers only.
- Each run creates an `agent_runs` record before work starts.
- Every external model/API/tool call creates a `tool_calls` record.
- Every run records workflow id, prompt version, model id, input refs, output refs, citation ids, latency, token usage, guardrail result, status, `trace_id`, and initiator.
- Student-facing text must pass safe-output projection.
- Guardrail/lint/verifier outputs of `REVIEW` or `BLOCK` must create a ReviewCase.
- Agents cannot approve their own high-risk output.
- Agents cannot make final teacher path decisions or expert research conclusions.

### 10.2 Workflow Contracts

| Workflow | Trigger | Owner role | Input schema | Output schema | Tools used | Model used | Human fallback | Audit requirement | ReviewCase creation condition | Student-safe constraints |
|---|---|---|---|---|---|---|---|---|---|---|
| `recommend_path` | Teacher requests path, learner state changes, constraints change, or replan requested | English teacher | Learner id, class id, unit id, learner profile refs, approved task pool, rule profile, teacher constraints, excluded tasks | Candidate `LearningPath`, `PathStep[]`, `RuleEvaluation`, `VerifierResult`, teacher/student explanation drafts | `task_search`, `rag_search`, `rubric_lookup`, `path_verifier_tool`, `review_case_creator`, `audit_log_writer` | `gpt-5.5` | Teacher review required unless tenant has explicit low-risk auto-delivery | `agent_runs`, `tool_calls`, `audit_logs`, path trace | No candidates, verifier `REVIEW/BLOCK/REPLAN`, blocked task, unapproved annotation, unsafe explanation | Student receives only published safe projection and `student_text` |
| `grade_objective_task` | Objective submission received | English teacher / system job | Submission id, task id, path id/version, learner id, response payload ref, answer key/rubric ref | Score label, feedback draft, evidence ids, lint result, submission status | `rubric_lookup`, `submission_writer`, `review_case_creator`, `audit_log_writer` | `gpt-5.5` only when rubric reasoning is needed; deterministic checker preferred for objective keys | Teacher ReviewCase on conflict/high-risk | `agent_runs` if model used, `tool_calls`, submission audit | Rubric conflict, lint `REVIEW/BLOCK`, version mismatch, abnormal response | Safe formative feedback only; hide answer key until generated feedback is safe |
| `transcribe_speaking` | Audio upload complete | English teacher / system job | `media_upload_id`, submission id, language hint, duration, signed media ref | Transcript, confidence metadata, transcription status | `media_signed_url`, `transcribe_audio`, `review_case_creator`, `audit_log_writer` | `gpt-4o-mini-transcribe` | Teacher review if confidence low or safety flag | `agent_runs`, `tool_calls`, media/submission audit | Low confidence, duration anomaly, safety/PII concern, failed transcription after retries | Student sees review-pending or safe transcript summary only |
| `feedback_speaking` | Transcript ready | English teacher | Transcript ref, task/rubric refs, learner-safe summary, retrieved chunks | Speaking feedback draft, safety status, evidence ids | `rag_search`, `rubric_lookup`, `feedback_generator`, `review_case_creator`, `audit_log_writer` | `gpt-5.5` | Teacher review for high-risk/low-confidence output | `agent_runs`, `tool_calls`, feedback artifact audit | Guardrail/lint `REVIEW/BLOCK`, high-risk feedback, unsupported claim | Formative, age-appropriate feedback; no high-stakes grade; no internal rubric notes |
| `generate_similar_practice` | Student taps Practice Similar or teacher assigns practice | English teacher / system job | Source task id, learner safe profile summary, approved task pool, constraints | Existing approved task id or draft practice candidate, rationale, review status | `task_search`, `rag_search`, `similar_task_generator`, `review_case_creator` | `gpt-5.5` | Use preapproved fallback tasks or teacher review | `agent_runs`, `tool_calls`, audit if new object created | New generated task, unsafe content, no approved candidate, lint `REVIEW/BLOCK` | Similar task must be safe, not copy original prompt, and not mutate main path unlock state |
| `content_annotation` | Content/task submitted for annotation | Curriculum researcher | Content version, task draft, approved taxonomy version, source refs, annotation profile | Candidate annotation, evidence locations, confidence, lint status, reason codes | `rag_search`, `content_annotation_tool`, `review_case_creator`, `audit_log_writer` | `gpt-5.5` | Researcher/expert approval | `agent_runs`, `tool_calls`, candidate annotation audit | New label request, low confidence, high-risk node, lint `REVIEW/BLOCK` | No direct student output; approved labels only can feed safe projections |
| `path_verifier` | Candidate path assembled or teacher modifies path | English teacher / system job | Path version, steps, task/content/annotation versions, learner scope, rules, constraints | Verifier result, reasons, blocking object refs | `path_verifier_tool`, `task_search`, `review_case_creator`, `audit_log_writer` | `gpt-5.5` if semantic verification is needed; deterministic checks first | Teacher review/replan | `agent_runs`, `tool_calls`, `decision_traces` when tied to path action | `REVIEW`, `BLOCK`, `REPLAN`, stale version, blocked object | Student sees unavailable/version-stale/review-pending state only |
| `review_case_triage` | ReviewCase created by lint, verifier, agent, LMS, or staff action | Case owner by object type | Object type/id, severity, reason codes, risk, organization/class, source version | Owner recommendation, queue category, deadline, human-readable summary | `review_case_creator`, `audit_log_writer` | `gpt-5.5` optional for summary normalization | Assigned teacher/researcher/expert/admin decides | `agent_runs`, `tool_calls`, ReviewCase audit | Missing owner/assignment, high-risk, unclear source snapshot | Student sees only high-level review-pending status |
| `rag_answer_teacher` | Staff asks content/rule/source question | Curriculum researcher / teacher | Query, source types, role scope, top_k, citation policy | Answer draft, citation ids, confidence/coverage | `rag_search`, `rubric_lookup`, `audit_log_writer` | `gpt-5.5` | Staff validates answer; no direct student output | `agent_runs`, `tool_calls`, citation audit | Missing citation, restricted source, unsupported claim, safety issue | Cannot be sent directly to Student Web without safe-output projection |
| `lms_sync` | Roster sync, path publish, submission result, grade/feedback summary, scheduled retry | System admin / teacher scoped | Object type/id, sync direction, external mapping, payload version, idempotency key | `lms_sync_statuses`, external id, retry/dead-letter state | `lms_publish_assignment`, `lms_submit_result`, `review_case_creator`, `audit_log_writer` | No model by default | Teacher/admin handles dead-letter or compensation | `queue_jobs`, `audit_logs`, sync status transitions | Retry exhaustion, business-blocking failure, payload conflict, auth failure | LMS status cannot make unpublished path visible; student sees only limited sync badge |

## 11. MCP/API Tool Registry

### 11.1 Registry Fields

Each tool registry entry includes:

| Field | Meaning |
|---|---|
| `tool_id` | Stable unique id |
| `tool_type` | Internal API, external API, OpenAI API, Supabase Storage, vector DB, LMS API, MCP tool |
| `owner` | Owning team/role |
| `allowed_roles` | Roles/workers allowed to invoke through backend |
| `input_schema` | Versioned input schema ref |
| `output_schema` | Versioned output schema ref |
| `secrets_required` | Required secret names, server-side only |
| `audit_level` | None, metadata, full trace, sensitive trace |
| `timeout/retry` | Timeout, retry count, backoff class, idempotency behavior |
| `allowed_workflows` | Workflow ids allowed to call this tool |
| `student_visible` | Whether any output can appear in student-safe projection |

### 11.2 Initial Tool Catalog

| Tool | Type | Owner | Allowed roles/workers | Secrets required | Audit level | Allowed workflows | Student visible |
|---|---|---|---|---|---|---|---|
| `task_search` | Internal API | Curriculum/system | Backend workers, teacher-scoped agents | None | Full trace | `recommend_path`, `generate_similar_practice`, `path_verifier` | No; only safe task fields after projection |
| `rag_search` | Vector DB/internal API | Research/system | Backend workers, researcher/admin/teacher scoped agents | Supabase server DB access | Full trace with citation ids | `recommend_path`, `feedback_speaking`, `content_annotation`, `rag_answer_teacher`, `generate_similar_practice` | No raw chunks; safe summaries only |
| `rubric_lookup` | Internal API | Curriculum | Backend workers | None | Metadata/full trace | `grade_objective_task`, `feedback_speaking`, `rag_answer_teacher` | No raw rubric hidden fields |
| `submission_writer` | Internal API | Student API/system | Student owner API, backend worker | None | Sensitive trace | `grade_objective_task` | Submission status/feedback only |
| `media_signed_url` | Supabase Storage API | System | Student owner API, teacher scoped API, backend workers | Supabase service credential server-side | Sensitive trace | `transcribe_speaking` | URL itself is short-lived; not stored as durable UI text |
| `transcribe_audio` | OpenAI API | System | Backend worker only | `OPENAI_API_KEY` | Sensitive trace | `transcribe_speaking` | Transcript only after safe review/projection |
| `feedback_generator` | OpenAI API | Curriculum/system | Backend worker only | `OPENAI_API_KEY` | Full trace | `feedback_speaking`, `grade_objective_task` | Safe feedback only |
| `similar_task_generator` | OpenAI API + RAG | Curriculum/system | Backend worker only | `OPENAI_API_KEY` | Full trace | `generate_similar_practice` | Only approved/safe task output |
| `review_case_creator` | Internal API | Governance/system | Backend workers, scoped staff actions | None | Full trace | All workflows that can emit REVIEW/BLOCK | Student sees only review-pending status |
| `lms_publish_assignment` | LMS API/mock adapter | System admin | Backend worker only | LMS secrets when real adapter enabled | Full trace | `lms_sync` | Limited sync status only |
| `lms_submit_result` | LMS API/mock adapter | System admin | Backend worker only | LMS secrets when real adapter enabled | Full trace | `lms_sync` | Limited sync status only |
| `content_annotation_tool` | Internal/OpenAI-assisted API | Curriculum | Backend worker only | `OPENAI_API_KEY` when model used | Full trace | `content_annotation` | No direct student output |
| `path_verifier_tool` | Internal API/model-assisted verifier | Governance/system | Backend worker only | `OPENAI_API_KEY` if model-assisted | Full trace | `recommend_path`, `path_verifier` | Only safe status mapping |
| `audit_log_writer` | Internal trusted RPC/API | System | Trusted server/service worker only | Supabase service credential server-side | Full trace | All write workflows | No |

Tool constraints:

- Write tools must require `trace_id`.
- Write tools should require `request_id` and `idempotency_key` where operation can be retried.
- Tools cannot return hidden fields to student-facing agents.
- LMS tools start as mock implementations and retain the real OAuth 2.0 interface.
- Tool output schema changes require a new registry version and compatibility check.

## 12. Queue And Async Jobs

### 12.1 Queue Backends

| Backend | Use |
|---|---|
| Celery/Redis | Production default for transcription, feedback, RAG ingestion, LMS sync, cleanup, retry, embedding, and agent workflows |
| FastAPI BackgroundTasks adapter | Local MVP adapter that uses the same job interface and writes the same observability rows |
| Supabase Edge Functions | Lightweight webhook receivers or signed URL helpers only; not complex long-running agent workflows |

### 12.2 Job States

Recommended `queue_jobs.status` values:

| State | Meaning |
|---|---|
| `QUEUED` | Job accepted and waiting |
| `RUNNING` | Worker started |
| `SUCCEEDED` | Completed successfully |
| `RETRY_WAITING` | Transient failure; waiting for retry |
| `FAILED` | Failed without more automatic retry |
| `DEAD_LETTER` | Retry exhausted or non-recoverable integration failure |
| `CANCELLED` | Superseded by newer version or explicit cancellation |
| `COMPENSATED` | External/manual compensation recorded |

### 12.3 Retry, Dead Letter, And Idempotency

- Use exponential backoff for transient OpenAI/LMS/storage/network failures.
- Do not retry deterministic validation failures without source change.
- Store `idempotency_key` for submission writes, LMS publish/result sync, RAG ingestion, and generated CRUD actions.
- Dead letters retain object type/id, source version, error class, safe error message, retry count, and trace id.
- Business-blocking failure creates a ReviewCase.
- OpenAI/LMS/Storage failures map to retryable vs blocking classes; user-facing surfaces receive safe status text only.

### 12.4 Job Audit

Every async job writes:

- `queue_jobs` state transitions.
- `agent_runs` when an agent/model workflow is used.
- `tool_calls` for each model/API/tool call.
- `audit_logs` for business/security writes.
- `lms_sync_statuses` for LMS transitions.
- `trace_events` for health and monitoring summaries.

## 13. LMS Connector Foundation

Start with `MockLmsAdapter`. Keep the adapter interface compatible with a real LMS OAuth 2.0 client credentials integration.

### 13.1 Environment And OAuth Shape

| Env var | Purpose |
|---|---|
| `LMS_BASE_URL` | LMS API base URL or mock adapter base |
| `LMS_CLIENT_ID` | OAuth client id |
| `LMS_CLIENT_SECRET` | OAuth client secret, server-only |
| `LMS_TOKEN_URL` | OAuth token endpoint |
| `LMS_WEBHOOK_SECRET` | Secret for validating LMS webhooks |

Required scopes:

- `classes:read`
- `assignments:write`
- `submissions:write`
- `grades:write`
- `users:read`

### 13.2 Sync Objects

| Sync | Direction | Behavior |
|---|---|---|
| Class roster sync | LMS -> AdaptLearn | Import/update class, teacher, student mappings into scoped records; no real minor data until policy changes |
| Path publish sync | AdaptLearn -> LMS | Publish assignment/path metadata only after AdaptLearn path is governed and deliverable |
| Submission result sync | AdaptLearn -> LMS | Send status/feedback summary after safe output or review-pending state is available |
| Grade/feedback summary sync | AdaptLearn -> LMS | Send safe summary and review flag, not internal rubrics or hidden evidence |

### 13.3 Error Behavior

- Auth failure, payload validation failure, external 4xx/5xx, timeout, and webhook validation failure become `lms_sync_statuses` transitions.
- Transient failures retry with backoff.
- Retry exhaustion writes `lms_dead_letters`.
- Business-blocking failures create ReviewCase.
- LMS sync success is separate from AdaptLearn publish; LMS failure cannot make an unpublished path visible and cannot hide an already valid AdaptLearn path from Student Web.

## 14. Schema / CRUD / Component Generation Strategy

### 14.1 Sources

Generated specs may be derived from:

- Supabase schema introspection.
- Pydantic models and FastAPI OpenAPI.
- Zod schemas in shared packages.
- Explicit table/form metadata approved in `generated_crud_specs`.

### 14.2 What Can Be Generated

| Generate | Examples |
|---|---|
| Low-risk list/detail CRUD | `system_settings`, `environment_checks`, non-sensitive source metadata, generated specs, schema versions |
| Read-only operational views | Database health, vector index monitor, job status tables, audit summaries with redaction |
| Admin table/form scaffolds | Content draft metadata, research claim drafts, source document metadata, tool registry entries |
| Validation artifacts | Field labels, enum options, required markers, filter controls, table columns |

### 14.3 What Requires Human Review

| Requires review | Reason |
|---|---|
| RLS policy generation | Security-sensitive; must pass role-scoped tests |
| Storage policies | Can expose media/source artifacts if wrong |
| Tool registry entries with secrets or writes | Can call external services or mutate data |
| Agent workflow definitions | Can generate outputs that affect students or staff decisions |
| CRUD over learner/submission/path/review/decision tables | Business and privacy risk |
| Student-facing components | Must pass UX, safety, and projection review; never fully autogenerated into production |

### 14.4 Generated Code And Hand-Written Boundaries

Recommended generated artifact areas:

| Area | Purpose |
|---|---|
| `packages/shared/generated/` | Generated TypeScript types and schema metadata |
| `apps/api/app/generated/` | Generated Pydantic/OpenAPI bindings or read-only DTOs |
| `apps/admin-web/src/generated/` | Generated Admin table/form metadata |
| `apps/foundation-console/src/generated/` | Generated Foundational Console table/form metadata |

Generated code must not contain secrets, service-role keys, raw student data, or production-only hidden fields for student-facing surfaces.

Hand-written business logic owns:

- Path publish guards.
- ReviewCase decisions.
- Teacher/expert decision panels.
- Learner state updates.
- Agent guardrails and safe-output projection.
- RLS policies and service-role RPCs after review.
- Student-facing task/profile/feedback components.

Every generated change writes `schema_versions` and `generated_crud_specs` with source schema refs, diff summary, risk level, reviewer, and version.

## 15. Environment And Secrets Checklist

### 15.1 Frontend Safe Values

| Env var | Required | Notes |
|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Browser-safe Supabase URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Browser-safe publishable key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Legacy fallback only |

### 15.2 Server Values

| Env var | Required | Notes |
|---|---:|---|
| `SUPABASE_URL` | Yes | Server Supabase URL |
| `SUPABASE_PUBLISHABLE_KEY` | Yes | Server-side public key when needed |
| `SUPABASE_ANON_KEY` | Optional | Legacy fallback only |
| `SUPABASE_SECRET_KEY` | Yes | Server-only secret key where applicable |
| `SUPABASE_SERVICE_ROLE_KEY` | Alias/alternative | Server-only; never browser |
| `SUPABASE_DB_URL` | Yes | Direct DB URL for migrations/server jobs |
| `SUPABASE_REGION` | Yes | `ap-northeast-1` |
| `SUPABASE_ENABLE_PGVECTOR` | Yes | Must be true for RAG vector search |
| `OPENAI_API_KEY` | Yes for agent/OpenAI work | Server-only |
| `OPENAI_AGENT_MODEL` | Yes | `gpt-5.5` |
| `OPENAI_EMBEDDING_MODEL` | Yes | `text-embedding-3-large` |
| `OPENAI_EMBEDDING_DIMENSIONS` | Yes | `1024` |
| `OPENAI_EMBEDDING_FALLBACK_MODEL` | Optional | e.g. lower-cost dev fallback |
| `OPENAI_TRANSCRIBE_MODEL` | Yes | `gpt-4o-mini-transcribe` |
| `OPENAI_TRANSCRIBE_FALLBACK_MODEL` | Optional | Higher accuracy fallback if needed |
| `REDIS_URL` | Production yes | Required for Celery/Redis |
| `LMS_BASE_URL` | Yes for LMS adapter | Mock or real |
| `LMS_CLIENT_ID` | Real LMS only | Server-only |
| `LMS_CLIENT_SECRET` | Real LMS only | Server-only |
| `LMS_TOKEN_URL` | Real LMS only | OAuth token endpoint |
| `LMS_WEBHOOK_SECRET` | If webhooks enabled | Server-only |

### 15.3 Checklist Page Requirements

- Show missing/present status without revealing secret values.
- Detect frontend exposure of server-only variables.
- Confirm Supabase URL, region, pgvector, storage buckets, Redis, OpenAI, and LMS adapter status.
- Write `environment_checks` on each run.
- Warn when mock/dev mode is enabled and display that flag prominently.

## 16. Compliance, Audit, And Retention

### 16.1 Current Compliance Position

- Mock only; no real minor data.
- Mock data must never be described as real model output or real learning-effect evidence.
- Dev/mock users and artifacts must be visibly flagged in UI and audit.
- Before real student data, define encryption/masking/access review/retention policy beyond platform defaults.

### 16.2 Seven-Day Mock Retention

Clean after 7 days unless explicitly exported:

- Mock student artifacts in `student-media`.
- Mock generated feedback/report artifacts in `generated-feedback`.
- Mock student submissions, media metadata, and reflection payload refs.
- `agent_runs`, `tool_calls`, `queue_jobs`, `audit_logs`, `trace_events`.
- LMS sync mock logs, `lms_sync_statuses`, `lms_dead_letters`.
- Prototype exports that contain mock student artifacts.

Project-controlled retention:

- `rag-source-docs` can be retained as project input according to project policy.
- If a RAG source document contains mock student data, it follows 7-day cleanup.
- `prototype-exports` is project-controlled by default; if it contains student mock artifacts, it follows 7-day cleanup.

### 16.3 Audit Coverage

Audit all:

- Auth-sensitive reads.
- Writes to tenant, role, scope, path, submission, media, content, taxonomy, RAG, agent, tool, queue, LMS, settings, schema, and generated CRUD objects.
- Service-role operations.
- Signed URL creation.
- RLS test runs and environment checks.
- Export actions and retention exceptions.

Minimum audit fields:

- `actor_user_id`
- `role`
- `organization_id`
- `class_id` when applicable
- `action`
- `object_type`
- `object_id`
- `before_snapshot_ref`
- `after_snapshot_ref`
- `request_id`
- `trace_id`
- `job_id` when applicable
- `ip_hash`
- `user_agent`
- `created_at`

## 17. Foundational Console Acceptance Criteria

- The console clearly identifies itself as platform foundation, not Student Web or Admin Web.
- The console lists and monitors all required pages: organization/tenant, users/roles/scopes, database, RLS, storage, RAG sources, vector indexes, agent workflows, tool registry, queues, LMS connector, audit, environment, health, and schema/CRUD generation.
- Student Web continues to read only own safe published/deliverable projections and writes submissions/media/reflections only through API.
- Foundational Console cannot publish blocked/review objects or bypass teacher/expert decisions.
- RLS test runner validates student owner, teacher assigned class, researcher content scope, expert ReviewCase scope, admin operational scope, and service-role job bypass.
- Browser clients cannot perform service-role actions.
- Storage buckets are private by default and signed URL access is audited.
- RAG ingestion stores citation ids and `rag_chunks.embedding vector(1024)`.
- Student-facing RAG/agent output shows only safe source summaries, not internal deliberation.
- Every agent run creates `agent_runs`; every external model/API/tool call creates `tool_calls`.
- Guardrail/lint/verifier `REVIEW` or `BLOCK` creates ReviewCase.
- Write tools require `trace_id`.
- Queue jobs have retry, dead-letter, idempotency, audit, and business-blocking ReviewCase behavior.
- LMS starts with `MockLmsAdapter` and keeps OAuth 2.0 client credentials shape.
- Generated CRUD specs are stored, versioned, risk-labeled, and reviewed before use.
- Student-facing components are never fully autogenerated without UX/safety review.
- Environment checklist includes all required Supabase, OpenAI, Redis, and LMS variables and hides secret values.
- Mock artifacts/logs are cleaned after 7 days unless explicitly exported.

## 18. References

- `docs/prototype/00_SOURCE_OF_TRUTH.md`
- `docs/prototype/01_PROTOTYPE_BRIEF.md`
- `docs/prototype/03_SCREEN_INVENTORY.md`
- `docs/prototype/04_ROUTE_MAP.md`
- `docs/prototype/05_FLOW_INDEX.md`
- `docs/prototype/06_STATE_MATRIX.md`
- `docs/prototype/08_ROLE_PERMISSION_MATRIX.md`
- `docs/prototype/09_MOCK_DATA_CONTRACT.md`
- `docs/prototype/13_STUDENT_WEB_SPEC.md`
- `docs/prototype/14_PRODUCTION_IMPLEMENTATION_SPEC.md`
- `docs/prototype/15_ADMIN_WEB_PRODUCTION_SPEC.md`
- `prototype/shared/src/schemas/core.ts`
