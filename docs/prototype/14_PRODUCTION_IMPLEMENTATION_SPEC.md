# 14 Production Implementation Spec

## 1. Purpose

This document turns `13_STUDENT_WEB_SPEC.md` into an implementation plan for production-oriented development and aligns the shared production foundation with `15_ADMIN_WEB_PRODUCTION_SPEC.md` and `16_FOUNDATIONAL_CONSOLE_SPEC.md`. It defines the target architecture, Supabase configuration, OpenAI model choices, authentication, LMS integration contract, RAG ingestion, agent tools, deployment, queueing, compliance, and required user-provided credentials.

The current implementation can start with mock adapters, but every adapter must keep the same interface as the production integration so it can be swapped without rewriting product flows.

Student Web, Admin Web, and Foundational Console share canonical tables, RLS helpers, service-role job rules, audit requirements, and agent/tool observability. Student Web must consume only student-safe projections. Admin Web owns business governance decisions. Foundational Console owns platform foundation, diagnostics, registries, environment checks, RLS test runner, and generated CRUD governance.

## 2. Confirmed Decisions

| Area | Decision |
|---|---|
| Product scope | Student Web production skeleton based on Unit 6 spec |
| Frontend | Next.js + React, mobile-first responsive UI |
| Frontend state | Zustand preferred for MVP; Redux only if cross-page workflow state becomes complex |
| Admin Web boundary | Desktop-first governed business workflows defined in `15_ADMIN_WEB_PRODUCTION_SPEC.md` |
| Foundational Console boundary | Platform foundation and generated CRUD governance defined in `16_FOUNDATIONAL_CONSOLE_SPEC.md` |
| Backend | FastAPI |
| Database | Supabase Postgres |
| Auth | Supabase Auth with email/password first; SSO and school account integration as extension paths |
| Storage | Supabase Storage |
| Vector search | Supabase Postgres with pgvector |
| OpenAI reasoning model | `gpt-5.5` planned for complex agent workflows |
| Embedding recommendation | `text-embedding-3-large` with `dimensions=1024` for balanced bilingual retrieval; fallback `text-embedding-3-small` for lower cost |
| Speech-to-text | `gpt-4o-mini-transcribe`; diarization only if future multi-speaker classroom audio is needed |
| LMS | Build against a mock LMS adapter first, with OAuth 2.0 client credentials shape |
| RAG corpus | 教材、题库、知识图谱、教师规则文档都可入库 |
| Deployment | Local Docker + Vercel frontend + FastAPI hosting + Supabase Cloud |
| Queue | Celery + Redis preferred for production; FastAPI BackgroundTasks allowed for local MVP; Supabase Edge Functions only for small edge jobs |
| Data | No real minor data for now; mock only |
| Data retention | 7 days for mock submissions, media, agent runs, queue payloads, and audit logs unless explicitly exported |
| Encryption/desensitization | No custom encryption/desensitization in MVP beyond platform defaults; revisit before real student data |

## 3. Required User-Provided Inputs

### 3.1 Supabase

These values must not be committed. Put them in `.env.local`, backend `.env`, and deployment secrets.

| Item | Status | Env var | Notes |
|---|---|---|---|
| Project URL | Confirmed | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_URL` | `https://aiczvdicexzwvkqpqncu.supabase.co` |
| Project region | Confirmed | `SUPABASE_REGION` | `ap-northeast-1` |
| Publishable key | User has this | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PUBLISHABLE_KEY` | Browser-safe key for Supabase client; newer Supabase projects may show this instead of legacy anon key |
| Legacy anon key | Optional fallback | `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ANON_KEY` | Use only if dashboard exposes legacy JWT anon key |
| Secret / service-role key | User must provide only to backend/deploy secrets | `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` | Never expose to browser; newer dashboard may call this a secret key |
| Database direct URL | User has direct connection string | `SUPABASE_DB_URL` | Used for migrations and backend server access |
| pgvector permission | User should enable | `SUPABASE_ENABLE_PGVECTOR=true` | Required for RAG vector search |
| Storage buckets | Use proposed names below | N/A | Create via migration or Supabase dashboard |

Proposed Storage buckets:

| Bucket | Purpose | Public? | Retention |
|---|---|---|---|
| `student-media` | Student audio/image/video submissions | No | 7 days for mock |
| `rag-source-docs` | Uploaded教材/题库/教师规则文档 | No | Project-controlled |
| `generated-feedback` | Optional generated report artifacts | No | 7 days for mock |
| `prototype-exports` | Demo exports/screenshots/videos | No by default | Project-controlled |

User action required:
- Create a Supabase account and project.
- Enable Postgres extension `vector`.
- Provide the publishable key, secret/service-role key, and DB direct URL when implementation starts.
- Confirm whether buckets should be created by SQL migration, CLI, or dashboard.

### 3.2 OpenAI

| Item | Status | Env var | Decision |
|---|---|---|---|
| API key | User will provide when needed | `OPENAI_API_KEY` | Backend only |
| Main model | Confirmed plan | `OPENAI_AGENT_MODEL=gpt-5.5` | Complex planning, grading, recommendation, agent orchestration |
| Embedding model | Recommended | `OPENAI_EMBEDDING_MODEL=text-embedding-3-large` | Use `OPENAI_EMBEDDING_DIMENSIONS=1024` |
| Low-cost embedding fallback | Optional | `OPENAI_EMBEDDING_FALLBACK_MODEL=text-embedding-3-small` | Useful for dev/test |
| Transcription model | Required | `OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe` | Student oral retelling |
| Higher-accuracy transcription fallback | Optional | `OPENAI_TRANSCRIBE_FALLBACK_MODEL=gpt-4o-transcribe` | Use if mini quality is insufficient |

OpenAI implementation rules:
- Call OpenAI only from FastAPI workers or trusted server code.
- Store prompts, retrieved citations, tool calls, model id, latency, token usage, and safety decisions in `agent_runs` / `tool_calls`.
- Student-facing output must strip internal rule weights, teacher audit records, ReviewCase details, and other-student data.
- Speaking feedback must be formative, age-appropriate, and not presented as a final high-stakes grade.

### 3.3 Auth

MVP auth sequence:

1. Supabase Auth email/password.
2. Role/profile lookup in `user_profiles`.
3. Middleware maps `auth.uid()` to app role and class/student scope.
4. SSO/school account integration is added later using the same profile table.

Supported auth modes:

| Mode | Priority | Notes |
|---|---|---|
| Supabase email/password | P0 | Required first implementation path |
| SSO | P1 | Add after tenant/provider details exist |
| School account | P1 | Implement through SSO/OIDC/SAML or LMS identity mapping |
| Mock auth | Dev only | Allowed for local tests, must be visibly flagged |

### 3.4 LMS

No real LMS credentials are available yet. Implement `MockLmsAdapter` first, then keep an interface compatible with a generic OAuth 2.0 LMS.

Proposed LMS integration contract:

| Need | Proposed shape |
|---|---|
| API docs | `docs/integrations/lms/openapi.yaml` or vendor URL |
| Test account | sandbox teacher + sandbox student |
| OAuth | client credentials for server sync; authorization code if user delegated actions are needed |
| Base URL | `LMS_BASE_URL` |
| Client ID | `LMS_CLIENT_ID` |
| Client secret | `LMS_CLIENT_SECRET` |
| Token URL | `LMS_TOKEN_URL` |
| Scopes | `classes:read`, `assignments:write`, `submissions:write`, `grades:write`, `users:read` |
| Webhook secret | `LMS_WEBHOOK_SECRET` if LMS sends updates |

Proposed sync objects:

| Object | Direction | Required fields |
|---|---|---|
| Class roster | LMS -> AdaptLearn | `lms_class_id`, `class_name`, `teacher_ids`, `student_ids`, `updated_at` |
| Assignment/path publish | AdaptLearn -> LMS | `path_id`, `student_id`, `title`, `due_at`, `task_ids`, `status` |
| Submission status | AdaptLearn -> LMS | `submission_id`, `task_id`, `student_id`, `status`, `submitted_at` |
| Grade/feedback summary | AdaptLearn -> LMS | `submission_id`, `score_label`, `feedback_summary`, `review_pending` |
| Sync status | Both | `external_id`, `status`, `retry_count`, `last_error`, `trace_id` |

### 3.5 RAG Source Materials

All listed materials can be ingested for the mock/production skeleton:

| Source | Can enter DB? | Storage | Notes |
|---|---|---|---|
| 教材 | Yes | `rag-source-docs` + `rag_documents` | Track copyright/source metadata |
| 题库 | Yes | `tasks`, `task_annotations`, `rag_documents` | Structured task rows plus source chunks |
| 知识图谱 | Yes | `knowledge_nodes`, `knowledge_edges`, `rag_documents` | Existing Unit 6 JSON is seed data |
| 教师规则文档 | Yes | `teacher_rules`, `rag_documents` | Must distinguish teacher-facing from student-facing content |

RAG ingestion requirements:
- Preserve source file, version, page/row references, source type, copyright status.
- Chunk text into stable `rag_chunks` with `source_ref`.
- Generate embeddings with `text-embedding-3-large`, dimensions 1024.
- Store vectors in `rag_chunks.embedding vector(1024)`.
- Retrieval must return citations; agent answers must include citation ids internally and safe source summaries for student output.

## 4. Target Architecture

```text
Next.js Student Web
  -> Supabase Auth client
  -> FastAPI API
      -> Supabase Postgres
      -> Supabase Storage
      -> Redis/Celery queue
      -> OpenAI Responses / Audio / Embeddings
      -> LMS adapter
      -> MCP/API tool adapters

Next.js Admin Web
  -> FastAPI /v1/admin APIs
  -> governed content, taxonomy, diagnosis, path review, ReviewCase, rules, research, monitoring workflows

Next.js Foundational Console
  -> FastAPI /v1/foundation APIs
  -> organization/role/RLS/storage/RAG/agent/tool/queue/audit/environment/schema generation foundation
```

Recommended repo layout:

```text
apps/
  web/                 # Next.js student web
  admin-web/           # Next.js admin business-governance surface
  foundation-console/  # Next.js platform-foundation console
  api/                 # FastAPI service
packages/
  shared/              # shared schema/types generated from OpenAPI/Pydantic/Zod
  shared/generated/    # generated metadata/types; never contains secrets or raw student data
supabase/
  migrations/
  seed/
  policies/
docs/
  integrations/
    lms/
    agent-tools/
    supabase/
```

Keep the current `prototype/` directory as reference until the production skeleton is stable.

Generated artifact guidance:

| Area | Purpose |
|---|---|
| `packages/shared/generated/` | Generated TypeScript types and schema metadata |
| `apps/api/app/generated/` | Generated Pydantic/OpenAPI bindings or read-only DTOs |
| `apps/admin-web/src/generated/` | Generated Admin table/form metadata |
| `apps/foundation-console/src/generated/` | Generated Foundational Console table/form metadata |

Generated code must not include secrets, service-role keys, raw student data, or student-hidden fields. RLS policies, storage policies, tool registry entries with writes/secrets, agent workflows, learner/submission/path/review/decision CRUD, and student-facing components require human review.

## 5. Supabase Schema Design

Minimum tables:

| Table | Purpose |
|---|---|
| `organizations` | Tenant/school organization |
| `classes` | Class scope |
| `user_profiles` | Supabase auth user id, role, display name, organization |
| `students` | Student profile and class binding |
| `class_memberships` | Teacher/student class scope |
| `knowledge_nodes` | Unit knowledge graph nodes |
| `knowledge_edges` | Unit knowledge graph edges |
| `tasks` | Task metadata and prompt |
| `task_annotations` | Bloom/thinking/node annotation |
| `learner_profiles` | Learner summary state |
| `bkt_states` | Per-node mastery state |
| `irt_states` | Ability state |
| `bloom_profiles` | Bloom evidence by node |
| `thinking_profiles` | Thinking quality dimensions |
| `learning_paths` | Path header |
| `path_steps` | Ordered tasks and status |
| `student_submissions` | Student responses and status |
| `media_uploads` | Uploaded audio/image/video metadata |
| `review_cases` | REVIEW/BLOCK cases |
| `decision_traces` | Human/system decision audit |
| `lms_sync_statuses` | LMS sync state |
| `rag_documents` | Source docs metadata |
| `rag_chunks` | RAG chunks and vectors |
| `agent_runs` | Agent workflow execution log |
| `tool_calls` | MCP/API tool call audit |
| `queue_jobs` | Optional app-level queue tracking |
| `audit_logs` | Security/business audit events |

Additional Admin/Foundation tables are additive production infrastructure. They should not break `prototype/shared/src/schemas/core.ts`; when exposed to Student Web, they must be projected into existing safe view-model shapes.

| Table group | Tables | Primary owner | Notes |
|---|---|---|---|
| Tenant/auth scope | `role_assignments`, `admin_sessions` | Foundational Console / Auth | Staff active role, organization, class, and review scope |
| Taxonomy versioning | `taxonomy_versions`, `taxonomy_change_requests` | Admin Web business workflow; Foundation monitors | Node/edge version history, impact mappings, expert review |
| Content/task lifecycle | `content_versions`, `content_drafts`, `unit_packages`, `annotation_jobs` | Admin Web | Content, task assembly, immutable published package versions |
| Rules/evidence | `rule_profiles`, `teacher_constraints`, `research_claims`, `evidence_sources`, `research_review_cases` | Admin Web | Teacher constraints, rule rollout, expert-governed evidence |
| LMS operations | `lms_dead_letters` | Foundational Console / LMS jobs; Admin monitors business impact | Retry exhaustion and compensation workflow |
| System foundation | `schema_versions`, `generated_crud_specs`, `environment_checks`, `system_settings` | Foundational Console | Schema diffs, CRUD generation, env readiness, tenant flags |
| Trace/monitoring | `trace_events` | Foundational Console / workers | Health and monitoring summaries linked to `audit_logs` |

Recommended student-safe views/API projections:

| Projection | Source tables | Purpose |
|---|---|---|
| `student_home_view` | `students`, `learning_paths`, `path_steps` | Home summary, next task, safe sync badge |
| `student_learning_path_view` | `learning_paths`, `path_steps`, `tasks`, `teacher_audit_explanation` | Path detail with safe reason chips and `student_text` only |
| `student_task_view` | `tasks`, `path_steps`, approved `task_annotations` | Prompt, response format, safe node/Bloom/thinking labels, media refs |
| `student_feedback_view` | `student_submissions`, feedback artifacts | Submission status, formative feedback, review pending, next action |
| `student_profile_summary_view` | `learner_profiles`, BKT/IRT/Bloom/thinking tables | Labels and evidence sufficiency, no raw probabilities/theta/rank |
| `student_upload_status_view` | `media_uploads` | Upload/retry/review-pending status |

Index requirements:
- Foreign-key indexes on all `_id` references.
- `path_steps(path_id, step_no)` unique.
- `student_submissions(learner_id, task_id, path_id, path_version)` for lookup.
- `student_submissions(idempotency_key)` unique.
- `review_cases(status, severity, owner_user_id)`.
- `lms_sync_statuses(status, next_retry_at)`.
- `agent_runs(user_id, workflow_type, created_at)`.
- `tool_calls(agent_run_id, tool_name, created_at)`.
- `rag_chunks` vector index using HNSW or IVFFlat after enough data exists.

RLS policy principles:
- Student can read only own safe projections and write own submissions/media/reflections through API with idempotency.
- Teacher can read assigned classes/students/submissions/media/diagnosis/path objects via `class_memberships` and active Admin scope.
- Curriculum researcher can manage content, tasks, annotations, taxonomy, RAG source usage, and aggregate QA, but not unrestricted student submissions.
- Expert can access assigned or eligible high-risk cases and only the minimum source snapshot needed for decision.
- Admin can manage organization/role/system settings, workflow assignments, monitoring, dead-letter operations, generated CRUD specs, and audit visibility, but cannot silently bypass teacher/expert decisions or directly edit learner state.
- Foundational Console can configure system base and run diagnostics but cannot replace Admin Web governed business decisions.
- Service role can run backend jobs only through trusted server/worker code. Each bypassed operation must include `job_id`, `workflow_type`, `initiated_by`, `request_id`, `trace_id`, object references, and `audit_logs` / `agent_runs` / `tool_calls` / `queue_jobs` / `lms_sync_statuses` as applicable.

## 6. FastAPI API Contract

API namespace ownership:

| Namespace | Owner surface | Purpose |
|---|---|---|
| `/v1/student` | Student Web | Student-safe projections, submissions, progress, profile, media status |
| `/v1/admin` | Admin Web | Staff business workflows: content, taxonomy, annotations, diagnosis, path review, ReviewCase, rules, research, monitoring |
| `/v1/foundation` | Foundational Console | Organization/role/RLS/storage/RAG index/agent/tool/queue/audit/environment/schema-generation foundation |
| `/v1/media`, `/v1/rag`, `/v1/agent`, `/v1/lms` | Backend service APIs | Scoped service helpers; must be wrapped by Student/Admin/Foundation authorization rules |

Common conventions:

- Browser clients use Supabase publishable credentials only.
- Service-role/secret credentials are server-only.
- Writes require `X-Request-Id`; non-idempotent writes require `Idempotency-Key`.
- Write responses include status plus relevant `trace_id`, `audit_log_id`, `decision_trace_id`, `review_case_id`, `queue_job_id`, `agent_run_id`, or `tool_call_id`.
- Error responses include a safe `trace_id` and must not leak object existence across tenant/scope boundaries.

Minimum endpoints:

| Method | Path | Purpose | Auth |
|---|---|---|---|
| `GET` | `/v1/me` | Current user profile and role scope | Authenticated |
| `GET` | `/v1/student/home` | Current student home | Student |
| `GET` | `/v1/student/path/{path_id}` | Student path detail | Student owner |
| `GET` | `/v1/student/tasks/{task_id}` | Task detail | Student owner + path access |
| `POST` | `/v1/student/tasks/{task_id}/submissions` | Submit answer/media ref with `learner_id`, `path_id`, `path_version`, `task_id`, and idempotency key | Student owner |
| `POST` | `/v1/student/tasks/{task_id}/similar` | Start similar practice | Student owner |
| `GET` | `/v1/student/progress` | Progress and review notebook | Student owner |
| `GET` | `/v1/student/profile` | Safe profile summary | Student owner |
| `POST` | `/v1/media/uploads/sign` | Create signed upload URL | Authenticated scoped |
| `POST` | `/v1/foundation/rag/documents` | Register/ingest RAG source through Foundation-governed pipeline | Researcher/admin |
| `POST` | `/v1/foundation/agent/runs` | Start platform-governed agent workflow; business workflows are invoked through Admin endpoints | Scoped by workflow |
| `GET` | `/v1/admin/review-cases` | Review queue | Staff scoped |
| `PATCH` | `/v1/admin/review-cases/{id}` | Review decision | Staff scoped |
| `POST` | `/v1/foundation/lms/sync` | Trigger mock/real LMS sync job; Admin Web may expose scoped business retry actions | Teacher/admin |

Student endpoint rules:

- Reads return projection DTOs, not canonical table rows.
- Task detail hides `answer_key_or_rubric`; feedback endpoint may return safe answer explanation after grading/projection.
- Path read checks deliverability guard: owner, current version, status, verifier PASS, no REVIEW/BLOCK lint, no unresolved blocking ReviewCase.
- Submission writes are idempotent and cannot update learner state until Data/Output Lint passes.
- REVIEW/BLOCK states map to safe UI statuses such as `review_pending`, `version_stale`, `unavailable`, or `queued_sync`.

Admin and Foundational APIs are specified in `15_ADMIN_WEB_PRODUCTION_SPEC.md` and `16_FOUNDATIONAL_CONSOLE_SPEC.md`. This implementation spec must not collapse them into generic table CRUD for governed learner/path/review/decision flows.

Middleware/dependencies:
- `get_current_user`
- `require_role`
- `require_student_owner`
- `require_assigned_class`
- `require_review_case_scope`
- request id / trace id middleware
- audit log middleware for writes
- idempotency middleware for submissions and LMS sync

## 7. Agent Workflow

Recommended workflows:

| Workflow | Trigger | Owner surface | Tools | Human fallback |
|---|---|---|---|---|
| `recommend_path` | Teacher requests path, learner state updates, teacher constraints change, or replan requested | Admin Web | `task_search`, `rag_search`, `rule_evaluator`, `constraint_checker`, `path_assembler`, `path_verifier_tool` | Teacher review required unless explicit low-risk auto-delivery is enabled |
| `path_verifier` | Candidate path assembled or teacher modifies path | Admin Web / backend jobs | `path_verifier_tool`, `task_search`, `review_case_creator`, `audit_log_writer` | Teacher review/replan |
| `grade_objective_task` | Objective submission | Student API / backend jobs | deterministic checker, `rubric_lookup`, `submission_writer`, `review_case_creator` | Teacher ReviewCase on conflict/high-risk |
| `transcribe_speaking` | Audio upload complete | Student API / backend jobs | `media_signed_url`, `transcribe_audio`, `review_case_creator` | Teacher review if confidence low |
| `feedback_speaking` | Transcript ready | Student API / backend jobs | `rag_search`, `rubric_lookup`, `feedback_generator`, `review_case_creator` | Teacher review for high-risk/low-confidence output |
| `generate_similar_practice` | Student taps Practice Similar or teacher assigns practice | Student API / Admin Web | `task_search`, `rag_search`, `similar_task_generator`, `review_case_creator` | Use preapproved fallback tasks or teacher review |
| `content_annotation` | Content/task submitted for annotation | Admin Web | `rag_search`, `content_annotation_tool`, `review_case_creator`, `audit_log_writer` | Researcher/expert approval |
| `diagnosis_summarizer` | New qualified evidence, teacher refresh, scheduled profile update | Admin Web / backend jobs | `submission_reader`, `evidence_lint_runner`, `bkt_updater`, `irt_updater`, `profile_summary_writer` | ReviewCase on evidence lint failure/high-risk output |
| `review_case_triage` | REVIEW/BLOCK created by lint, verifier, agent, LMS job, or staff action | Admin Web / backend jobs | `source_snapshot_reader`, `risk_reason_normalizer`, `owner_router`, `queue_writer` | Assigned staff makes final conclusion |
| `research_evidence` | RAG source ingested, researcher creates claim, citation lint requested | Admin Web | `rag_search`, `citation_extractor`, `claim_normalizer`, `citation_lint_runner` | Expert approves/rejects/request fix |
| `rag_answer_teacher` | Staff asks content/rule/source question | Admin Web | `rag_search`, citation builder, `audit_log_writer` | Staff validates answer; no direct student output |
| `lms_sync` | Roster sync, path publish, submission result, grade/feedback summary, scheduled retry | Foundational Console / Admin monitoring | `lms_adapter`, `sync_payload_builder`, `retry_scheduler`, `dead_letter_writer`, `review_case_creator` | Teacher/admin handles dead-letter or compensation ReviewCase |

Agent run rules:
- Every run creates `agent_runs`.
- Every external call creates `tool_calls`.
- Store workflow id, prompt version, model id, input refs, output refs, retrieved chunk/citation ids, latency, token usage, guardrail result, status, initiator, and `trace_id`.
- Student-facing text must pass a safe-output projection.
- If guardrail/lint/verifier emits REVIEW or BLOCK, output is blocked and `ReviewCase` is created.
- Agents cannot approve their own high-risk output, publish student paths, or make final expert research conclusions.
- Candidate annotations and generated tasks remain candidates until an authorized human/governed workflow approves them.

## 8. MCP/API Tool Catalog

Tools are registered and governed through Foundational Console. Code may ship local defaults, but production enablement, allowed workflows, secret bindings, retries, and audit level are registry data.

Registry fields:

| Field | Purpose |
|---|---|
| `tool_id`, `tool_name`, `tool_type`, `version` | Stable identity and compatibility checks |
| `owner` | Student API, Admin Web, Foundation, worker, or external provider owner |
| `allowed_roles`, `allowed_workflows` | Authorization and workflow binding |
| `input_schema`, `output_schema` | JSON schema versioned with generated SDK/types |
| `secrets_required` | Named secret bindings, never raw secret values |
| `audit_level` | `metadata`, `payload_ref`, or `full_snapshot_ref` |
| `timeout_ms`, `retry_policy` | Worker/runtime behavior |
| `student_visible` | Whether output may be projected to Student Web |

Initial tool registry:

| Tool | Type | Owner | Allowed workflows | Student visible | Input | Output |
|---|---|---|---|---|---|---|
| `task_search` | Internal API | Admin/worker | `recommend_path`, `path_verifier`, `generate_similar_practice` | Safe reasons only | `{ learner_id?, node_ids, bloom?, difficulty?, exclude_task_ids? }` | `{ task_ids, reasons, citation_ids? }` |
| `rag_search` | Internal API/vector DB | Foundation/worker | `recommend_path`, `feedback_speaking`, `content_annotation`, `research_evidence`, `rag_answer_teacher` | Only after projection | `{ query, source_types, top_k, user_scope }` | `{ chunks: [{ chunk_id, score, citation_id }] }` |
| `rubric_lookup` | Internal API | Admin/worker | `grade_objective_task`, `feedback_speaking` | No raw answer key | `{ task_id, rubric_type }` | `{ rubric_ref, answer_key_ref, review_policy }` |
| `submission_writer` | Internal API | Student API/worker | `grade_objective_task` | Status only | `{ learner_id, task_id, path_id, path_version, response_ref, idempotency_key }` | `{ submission_id, status, lint_status }` |
| `media_signed_url` | Supabase Storage API | Student API/Foundation | upload/download helpers | Signed URL only | `{ bucket, object_path, operation }` | `{ signed_url, expires_at, upload_id }` |
| `transcribe_audio` | OpenAI API | Worker | `transcribe_speaking` | Transcript only after lint | `{ media_upload_id, language_hint, prompt_ref? }` | `{ transcript_ref, confidence_metadata_ref }` |
| `feedback_generator` | OpenAI API | Worker | `feedback_speaking`, `generate_similar_practice` | Safe feedback only | `{ task_id, answer_ref, transcript_ref?, rubric_ref, retrieved_chunk_ids }` | `{ feedback_ref, safety_status }` |
| `similar_task_generator` | OpenAI API + RAG | Worker | `generate_similar_practice` | Approved/safe practice only | `{ source_task_id, learner_profile_summary_ref, constraints }` | `{ task_draft_id_or_existing_task_id, safety_status }` |
| `content_annotation_tool` | OpenAI API + RAG | Admin/worker | `content_annotation` | No | `{ content_version_id, taxonomy_version_id, task_ids? }` | `{ annotation_candidate_ids, confidence_refs, citation_ids }` |
| `path_verifier_tool` | Internal verifier | Admin/worker | `recommend_path`, `path_verifier` | Safe status only | `{ path_id, path_version, learner_id }` | `{ verifier_status, issue_codes, review_case_id? }` |
| `review_case_creator` | Internal API | Admin/worker | any REVIEW/BLOCK workflow | No | `{ object_type, object_id, severity, reason_codes, source_refs }` | `{ review_case_id }` |
| `audit_log_writer` | Internal API | Foundation/worker | all write workflows | No | `{ action, object_ref, before_ref?, after_ref?, trace_id }` | `{ audit_log_id }` |
| `lms_adapter` | LMS API/mock | Foundation/worker | `lms_sync` | Safe sync status only | `{ operation, payload_ref, idempotency_key }` | `{ external_id?, sync_status, retry_at? }` |
| `citation_extractor` | Internal API | Admin/worker | `research_evidence`, `rag_answer_teacher` | Staff only unless projected | `{ source_ref, claim_ref? }` | `{ citation_ids, lint_status }` |
| `queue_writer` | Internal API | Foundation/worker | async workflow orchestration | No | `{ workflow_type, payload_ref, trace_id }` | `{ queue_job_id, status }` |

Tool constraints:
- Tools that write data must require `trace_id`, `request_id`, and an idempotency key when the operation may be retried.
- Tools cannot return hidden fields to student-facing agents.
- Tool schema changes require registry version updates and compatibility checks before generated SDK/types are refreshed.
- External tool calls must write `tool_calls`; agent-backed tool calls must also link to `agent_runs`.
- LMS tools start as `MockLmsAdapter` with the OAuth 2.0 client credentials interface preserved until real docs and credentials exist.

## 9. Queue Strategy

Production default:
- Celery + Redis for transcription, feedback generation, RAG ingestion, LMS sync, and retry jobs.

Local MVP:
- FastAPI BackgroundTasks may run the same job interfaces synchronously/asynchronously.
- Jobs must still write `queue_jobs` or `agent_runs` status so behavior can be observed.

Supabase Edge Functions:
- Reserve for lightweight webhook receivers or signed URL helpers only.
- Do not put complex long-running agent workflows in Edge Functions for MVP.

Retry policy:
- Retry transient OpenAI/LMS/storage errors with exponential backoff.
- Use queue states: `QUEUED`, `RUNNING`, `SUCCEEDED`, `RETRY_WAITING`, `FAILED`, `DEAD_LETTER`, `CANCELLED`, `COMPENSATED`.
- Move repeated failures to `DEAD_LETTER` and write `lms_dead_letters` for LMS operations.
- Create ReviewCase for business-blocking failures.
- Idempotency is required for submissions, LMS publish/result sync, RAG ingestion, generated CRUD jobs, and any queue job that may be retried.
- Every async job writes `queue_jobs`, `trace_events`, and, as applicable, `agent_runs`, `tool_calls`, `audit_logs`, and `lms_sync_statuses`.

## 10. Audit And Retention

Mock data retention:
- Delete or archive mock submissions, media uploads, generated feedback/report artifacts, queue payloads, agent runs, tool calls, trace events, LMS sync logs, LMS dead letters, and audit logs after 7 days.
- RAG source documents may be retained until explicitly removed because they are project inputs, not student records. If a source contains mock student data, apply the same 7-day cleanup rule.

Audit requirements:
- Audit all auth-sensitive reads and all writes.
- Include `actor_user_id`, `role`, `organization_id`, `class_id` when applicable, `action`, `object_type`, `object_id`, `before_snapshot_ref`, `after_snapshot_ref`, `request_id`, `trace_id`, `ip_hash`, `user_agent`, `created_at`.
- Service-role jobs must include `job_id` and `initiated_by`.
- Agent/tool calls must include model/tool name, input reference, output reference, safety status, and citation ids where applicable.
- Audit signed URL creation, RLS test runs, environment checks, export actions, generated CRUD spec generation, migration application, role/scope changes, dead-letter compensation, and LMS sync retries.
- Store payloads by reference when they may contain student responses, media metadata, internal rule weights, expert deliberation, or credentials.
- Audit logs are mock-only for now; before real student data, define encryption, masking, access review, and longer retention policy.

## 11. Development Order

1. Align `13`, `14`, `15`, and `16` shared schema ownership, route ownership, safe projection contracts, RLS helper assumptions, and generated artifact boundaries.
2. Add `.env.example` for web/api/Supabase/OpenAI/LMS/Redis/Foundation checks.
3. Add Supabase migrations for base Student/Admin/Foundation tables, RLS, pgvector, storage policies, safe projection views, and generated CRUD metadata.
4. Add FastAPI app skeleton with auth dependencies, Supabase clients, request/trace middleware, role/scope helpers, and service-role guardrails.
5. Add Next.js Student app skeleton and migrate current student UI flow.
6. Implement student home/path/task/submit/progress/profile API endpoints against projection DTOs only.
7. Implement one E2E flow: login/mock auth -> read path -> submit Step1 -> feedback -> unlock Step2.
8. Add RAG ingestion and vector search through Foundation-governed source/index registry.
9. Add OpenAI transcription and feedback worker behind a queue interface.
10. Add agent run/tool call/queue/trace audit.
11. Add LMS mock adapter, sync statuses, dead-letter path, and compensation ReviewCase link.
12. Add Foundation readiness scripts for RLS verification, environment checks, storage bucket checks, and generated CRUD spec validation.
13. Add tests: SQL/RLS, FastAPI pytest, frontend unit tests, Playwright smoke, safe projection leak checks.

## 12. User Checklist Before Production Skeleton Work

- Create Supabase account and project.
- Supabase region confirmed: `ap-northeast-1`.
- Enable pgvector.
- Provide Supabase publishable key, secret/service-role key, and database direct URL through local secrets.
- Provide OpenAI API key when OpenAI integration starts.
- Provide Redis URL for Celery in shared/local deployment, or confirm BackgroundTasks-only MVP.
- Confirm whether SSO provider is Google Workspace, Microsoft Entra, school OIDC/SAML, or later.
- Provide real LMS vendor/API docs later; until then use mock LMS adapter defined here.
- Provide LMS webhook secret if inbound LMS webhooks are required.
- Provide RAG source files or confirm current `docs/data` and `docs/source` are enough for seed ingestion.
- Confirm deployment target accounts: Vercel, FastAPI hosting provider, Supabase Cloud.
- Confirm Admin Web and Foundational Console route ownership before adding generated CRUD or staff workflows.
- Confirm real-data policy, parental/school consent, retention, masking, and incident response before any real minor data is loaded.

## 13. References

- Product spec: `docs/prototype/13_STUDENT_WEB_SPEC.md`
- Admin Web production spec: `docs/prototype/15_ADMIN_WEB_PRODUCTION_SPEC.md`
- Foundational Console spec: `docs/prototype/16_FOUNDATIONAL_CONSOLE_SPEC.md`
- Mock data contract: `docs/prototype/09_MOCK_DATA_CONTRACT.md`
- Shared schema: `prototype/shared/src/schemas/core.ts`
- Student prototype: `prototype/student-web/src/App.tsx`
- Student view model: `prototype/student-web/src/lib/adaptlearn.ts`
- OpenAI models docs: `https://developers.openai.com/api/docs/models`
- OpenAI embeddings docs: `https://developers.openai.com/api/docs/guides/embeddings`
- OpenAI speech-to-text docs: `https://developers.openai.com/api/docs/guides/speech-to-text`
