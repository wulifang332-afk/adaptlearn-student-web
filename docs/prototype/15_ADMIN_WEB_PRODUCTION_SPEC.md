# 15 Admin Web Production Spec

## 1. Purpose

This document defines the production implementation specification for AdaptLearn Admin Web. It extends the prototype contracts in `01_PROTOTYPE_BRIEF.md` through `09_MOCK_DATA_CONTRACT.md`, aligns with `13_STUDENT_WEB_SPEC.md`, complements the shared production architecture in `14_PRODUCTION_IMPLEMENTATION_SPEC.md`, and stays inside the business-governance boundary defined by `16_FOUNDATIONAL_CONSOLE_SPEC.md`.

The Admin Web is the governance and operations surface for Unit 6 and future units. It lets staff manage content, annotations, knowledge graph nodes, task assembly, diagnosis, learning path review, ReviewCase handling, teacher constraints, research evidence, and monitoring. It must protect student privacy while still giving teachers enough evidence to make accountable decisions.

## 2. Scope

Production Admin Web covers:

| Area | Primary roles | Priority | Production purpose |
|---|---|---|---|
| Login / Organization Selection | Teacher, curriculum researcher, expert, admin | P0 | Establish organization, role, and class/review scope before access |
| Dashboard | Teacher, curriculum researcher, expert, admin | P0 | Summarize pending work, class status, ReviewCases, sync status, and system alerts |
| Content Library & Editor | Curriculum researcher, teacher read/use | P0 | Manage Unit content, source metadata, versioning, copyright, and publication state |
| Taxonomy / Knowledge Graph Management | Curriculum researcher, expert | P0 | Manage English knowledge graph nodes and edges used by tasks, diagnosis, and recommendations |
| AI Annotation Review | Curriculum researcher, expert | P0 | Review candidate knowledge/Bloom/thinking annotations before formal use |
| Course & Task Assembly | Curriculum researcher, teacher | P0 | Assemble approved tasks into unit packages and candidate task sets |
| Student / Class Diagnosis | Teacher | P0 | Diagnose assigned classes/students using evidence and uncertainty labels |
| Learning Path Review | Teacher | P0 | Approve, modify, reject, or replan learning paths before student delivery |
| ReviewCase / Quality Queue | Teacher, curriculum researcher, expert, admin | P0 | Resolve REVIEW/BLOCK cases and keep source flows from continuing silently |
| Rules & Teacher Constraints | Teacher, curriculum researcher, admin | P1 | Manage teacher constraints, rule versions, thresholds, and rollout status |
| Research Evidence | Expert, curriculum researcher | P1 | Govern claims, citations, evidence matrix, and expert decisions |
| Monitoring | Admin, curriculum researcher | P1 | Inspect business-scoped LMS sync, dead-letter jobs, trace links, agent summaries, and audit health |

Non-goals:

- No student-facing UI is implemented in Admin Web.
- No staff role can bypass RLS by using browser-side credentials.
- No admin user can silently override teacher path decisions or expert research conclusions.
- No student-safe projection may expose internal rule weights, teacher audit records, ReviewCase details, or unreliable exact rankings.
- No platform-foundation pages are implemented here. Supabase/database health, RLS test runner, storage bucket policy, RAG/vector index monitoring, agent/tool registry, queue backend configuration, environment/secrets checks, and generated CRUD governance belong to the Foundational Console in `16_FOUNDATIONAL_CONSOLE_SPEC.md`.

## 3. Role Model

| Role | Admin Web responsibilities | Hard limits |
|---|---|---|
| English teacher | View assigned classes, inspect diagnosis, generate/review paths, approve/modify/reject/replan, publish to students, handle assigned path/output ReviewCases | Cannot access unassigned classes; cannot modify without required reason; cannot publish BLOCK/REVIEW-gated paths |
| Curriculum researcher | Manage content, task bank, knowledge graph nodes/edges, task annotations, task assembly, content ReviewCases, research claims, and RAG source usage in governed workflows | Cannot make final teacher decisions for a learner path; cannot browse unrestricted student submissions; cannot manage platform RAG/vector infrastructure outside Foundational Console |
| Expert | Review high-risk annotations, expert ReviewCases, research claims, evidence sources, and citation decisions | Cannot publish student paths; cannot access unrelated student data outside assigned/high-risk cases |
| System admin | Manage Admin Web business operations such as ReviewCase assignment, rule release/rollback, LMS sync compensation, dead-letter triage, and business audit visibility | Cannot silently overwrite teacher or expert conclusions; cannot use Admin Web to edit student learning state directly; foundational tenant/role/RLS/tool/queue configuration belongs to Foundational Console |
| Service role job | Run backend jobs, agents, LMS sync, ingestion, and maintenance | Must write `audit_logs`, `agent_runs`, `tool_calls`, or `queue_jobs` as applicable for every write |

## 4. Admin Functional Specification

### 4.1 Login / Organization Selection

Routes:

- `/admin/login`
- `/admin/org`

Required behavior:

- Authenticate through Supabase Auth in production.
- Resolve app role through `user_profiles`.
- Let staff choose only organizations and scopes assigned to them.
- Let multi-role users choose active role context before entering Dashboard.
- Let teachers choose assigned class scope when they have more than one class.
- Persist active organization, role, and class/review scope in server-validated session state.

Required data:

- `auth.users`
- `user_profiles`
- `organizations`
- `classes`
- `class_memberships`
- `role_assignments`

Acceptance:

- A teacher entering `/admin` without active class scope is redirected to organization/scope selection.
- A curriculum researcher can enter content/taxonomy/annotation areas without being granted broad student data access.
- Permission denied states must identify the missing scope, not leak object existence across tenants.

### 4.2 Dashboard

Route:

- `/admin`

Teacher dashboard modules:

- Assigned class cards with student count, active Unit, path-review count, and review-pending count.
- Priority review queue grouped by teacher-readable categories:
  - Student submissions needing review.
  - Learning paths needing approval.
  - Blocked publishing items.
  - Sync issues requiring attention.
- Class diagnosis summary with evidence sufficiency labels.
- Recent teacher decisions with plain language task/path names, not internal IDs.
- LMS publication sync status for assigned classes.

Curriculum researcher dashboard modules:

- Content versions needing source/copyright fixes.
- Annotation cases by Unit/module/node.
- Knowledge graph change requests.
- Task assembly lint failures.
- RAG source registration and ingestion status from Foundational Console.

Expert dashboard modules:

- High-risk annotation cases.
- Research evidence claims awaiting expert decision.
- ReviewCases assigned to expert or eligible high-risk pool.

Admin dashboard modules:

- Active organization, role, and class-scope summary from Foundational Console assignments.
- Admin workflow version and rule rollout status.
- LMS sync summary, retry waiting, and dead-letter count.
- Business-scoped agent queue status with trace links.
- Audit coverage summary with links to Foundational Console audit explorer.

Acceptance:

- Dashboard cards link to filtered work queues.
- Dashboard never shows raw internal codes as primary labels. Internal IDs may appear only in secondary debug/copy fields.
- Staff only see counts derived from objects they can access.

### 4.3 Content Library & Editor

Routes:

- `/admin/content`
- `/admin/content/:contentVersionId`

Content operations:

- Create a content draft for a Unit/module.
- Edit title, source metadata, copyright status, module, language skill, pedagogical objective, and teacher-facing notes.
- Attach or reference source material stored in `rag-source-docs`.
- Submit draft to pre-lint.
- Submit lint-passing content to AI annotation.
- Archive drafts or withdrawn versions.
- Create a new version from a published locked version.
- Withdraw a published version only through a governed action that writes `DecisionTrace` and `audit_logs`.

Content state rules:

- `DRAFT` can be edited.
- `PRE_LINT` is read-only except metadata fix actions.
- `APPROVED` can enter assembly.
- `PUBLISHED_LOCKED` cannot be edited in place.
- `BLOCKED` cannot enter annotation, assembly, recommendation, or student projection.

Required fields:

- `content_version_id`
- `organization_id`
- `unit_id`
- `module`
- `title`
- `body_ref` or structured body fields
- `source_type`
- `source_ref`
- `copyright_status`
- `language_skill_tags`
- `created_by`
- `status`
- `version`

Acceptance:

- Missing source/copyright blocks publish and creates or updates a ReviewCase when lint emits REVIEW/BLOCK.
- Published content is immutable; edits create a new version.
- Teacher users can read approved/published content for task review but cannot publish curriculum content unless granted explicit researcher permission.

### 4.4 Taxonomy / English Knowledge Graph Management

Routes:

- `/admin/taxonomy`
- `/admin/taxonomy/:nodeId`

Purpose:

Manage the English knowledge graph used by task annotation, diagnosis, recommendation, and student-safe labels. The UI should support multi-level expand/collapse, node CRUD, edge CRUD, version comparison, and impact analysis.

Knowledge graph operations:

- Create a node under an allowed parent.
- Edit teacher-facing node name, English label, definition, module, level, Bloom target, thinking target, strategy tags, evidence task types, priority, and risk.
- Add, edit, or remove edges such as prerequisite, supports, refines, contrasts, or evidence-for.
- Merge duplicate nodes into a canonical node.
- Deprecate a node instead of hard-deleting it when it is referenced by tasks, annotations, evidence, or paths.
- Request expert review for high-risk structural changes.
- Publish a taxonomy version after lint and impact checks pass.

Node hierarchy requirements:

- The UI must display at least three levels: domain/dimension, skill cluster, and teachable knowledge/skill node.
- Child counts, referenced task counts, and risk indicators must be visible in dense rows.
- Expand/collapse state should be URL-addressable so reviewers can share a focused branch.

Data rules:

- Formal labels cannot be created directly by an LLM. Agents may propose candidate nodes, but a curriculum researcher or expert must approve them.
- A node referenced by `tasks`, `task_annotations`, `learning_evidence`, or `learning_paths` cannot be hard-deleted.
- Node edits that change meaning create a new `taxonomy_versions` record and keep compatibility mappings.
- Student-facing labels are stored separately from internal definitions when needed.

Acceptance:

- A researcher can add, edit, deprecate, merge, and publish English knowledge graph nodes.
- Impact analysis shows affected tasks, annotations, learner states, and paths before publish.
- Student Web receives only safe node labels and progress summaries, not internal graph review notes or risk metadata.

### 4.5 AI Annotation Review

Routes:

- `/admin/annotations`
- `/admin/annotations/:annotationId`

Purpose:

Review candidate tags, evidence positions, confidence, lint output, and QC routing before a task annotation becomes approved.

Operations:

- Inspect candidate knowledge nodes, Bloom requirement, thinking requirement, evidence locations, confidence, and rationale.
- Accept candidate annotation.
- Modify node/Bloom/thinking tags.
- Delete incorrect tags.
- Return for relabeling.
- Block an annotation.
- Request a new taxonomy node review.
- Escalate high-risk cases to expert.

Required review details:

- Task title and teacher-readable task name.
- Source content version and module.
- Candidate nodes with hierarchy path.
- Evidence location references.
- Confidence band and lint status.
- ReviewCase status when REVIEW/BLOCK exists.

State rules:

- `AUTO_ANNOTATING` cannot become `APPROVED` without QC routing.
- `QC_ROUTING` can auto-sample low-risk high-confidence annotations only when configured.
- `REVIEW_REQUIRED` must have an open or assigned ReviewCase.
- `BLOCKED` cannot enter assembly or recommendation.

Acceptance:

- REVIEW/BLOCK always creates ReviewCase.
- Approved annotation stores actor, timestamp, taxonomy version, and source content version.
- Student Web never reads raw annotation confidence, lint notes, or expert deliberation.

### 4.6 Course & Task Assembly

Routes:

- `/admin/assembly`
- `/admin/assembly/:packageId`

Purpose:

Assemble approved tasks and content into Unit packages and candidate task sets used by recommendation.

Operations:

- Select Unit/module/task set.
- Filter tasks by module, node, Bloom, thinking dimension, task type, difficulty, estimated minutes, risk, and review policy.
- Build or edit task sequences.
- Set package goals, target audience, time budget, and delivery constraints.
- Run Assembly Lint.
- Publish package after lint pass.
- Lock published package versions.

Rules:

- Only approved tasks and annotations can enter candidate sets.
- Assembly Lint BLOCK stops package publication.
- REVIEW creates ReviewCase and keeps package in review state.
- Package publish writes `DecisionTrace` and `audit_logs`.

Acceptance:

- Task assembly cannot silently include blocked or unapproved tasks.
- Published package versions are immutable.
- Teachers can view package rationale during path review but cannot see hidden scoring weights.

### 4.7 Student / Class Diagnosis

Routes:

- `/admin/classes/:classId/diagnosis`
- `/admin/students/:learnerId/diagnosis`

Purpose:

Help teachers understand assigned class/student needs before reviewing or generating learning paths.

Teacher operations:

- Select assigned class.
- Filter by student, Unit, module, knowledge node, evidence sufficiency, path status, and review risk.
- Inspect BKT, IRT, Bloom, thinking quality, strategy, and submission evidence.
- Open evidence snippets that are allowed for the teacher's class scope.
- Start path generation for a selected student or group.
- Open existing path review.
- Flag suspicious/insufficient evidence for ReviewCase.

Display rules:

- Use uncertainty labels and evidence counts.
- Do not collapse BKT, IRT, Bloom, and thinking into one score.
- Do not present exact rank as a stable student label.
- Use student pseudonymous or configured school display name according to tenant policy.

Acceptance:

- Teacher sees only assigned classes and students.
- Curriculum researcher sees only aggregate QA views unless a governed ReviewCase grants access to a specific object.
- Low-confidence diagnosis must say evidence is insufficient and must not trigger unsupported conclusions.

### 4.8 Learning Path Review

Routes:

- `/admin/paths/:pathId/review`

Purpose:

Let the teacher audit, approve, modify, reject, or replan a proposed path before it reaches students.

Teacher operations:

- Review path goal, target learner, active Unit, candidate tasks, sequence, time budget, and student-safe explanation.
- Inspect evidence drawer for diagnosis inputs.
- Inspect rule hits, hard filters, excluded tasks, and verifier result.
- Approve as-is.
- Modify by replacing tasks, reordering steps, shortening path, changing due date, or adding teacher constraints.
- Reject path with required reason.
- Request replan with required reason and optional constraints.
- Publish after approval when deliverability guard passes.

Decision rules:

- `APPROVE`, `MODIFY`, `REJECT`, and `REPLAN` must create `DecisionTrace`.
- `MODIFY`, `REJECT`, and `REPLAN` require non-empty teacher reason.
- Manual modifications create a new path version.
- Publish requires:
  - teacher owns assigned class scope,
  - path belongs to learner in that class,
  - path is current version,
  - path has no unresolved blocking ReviewCase,
  - Path Lint has no REVIEW/BLOCK,
  - Verifier status is `PASS`,
  - tasks and annotations are approved/published versions.
- BLOCK cannot be bypassed by teacher override.

Acceptance:

- Student Web reads the path only after status becomes `PUBLISHED` and the student-safe projection is ready.
- Teacher audit explanation can have teacher-only text and student-safe text; only `student_text` can reach Student Web.
- Version conflicts show stale state and require refresh.

### 4.9 ReviewCase / Quality Queue

Routes:

- `/admin/review-cases`
- `/admin/review-cases/:reviewCaseId`

Purpose:

Handle all REVIEW/BLOCK states across content, annotations, paths, submissions, media, LMS sync, and research evidence.

Queue grouping:

- Student submissions needing review.
- Learning paths blocked before publication.
- Content or copyright issues.
- Annotation or taxonomy issues.
- Research evidence issues.
- LMS sync failures and dead letters.

Operations:

- Assign owner.
- Claim eligible case.
- Inspect source object snapshot.
- Inspect reason codes and risk level in teacher/researcher-readable language.
- Approve.
- Conditionally approve with constraint.
- Request fix.
- Reject.
- Mark final block.
- Reopen after source version changes.
- Return to source screen.

Blocking rules:

- REVIEW/BLOCK without ReviewCase is a production blocker.
- Source flow cannot publish/recommend/update while an unresolved blocking ReviewCase exists.
- `BLOCKED_FINAL` remains blocking until a new source version is created and reviewed.
- Resolution requires actor, conclusion, version, timestamp, and audit log.

Acceptance:

- ReviewCase primary labels must be human-readable task/content/student submission names, not internal IDs.
- Teachers can access path/output cases for assigned classes only.
- Experts can access assigned/high-risk cases only.
- Admin can assign and monitor cases but cannot silently change the substantive conclusion.

### 4.10 Rules & Teacher Constraints

Routes:

- `/admin/rules`
- `/admin/rules/:ruleProfileId`

Purpose:

Manage teacher constraints, rule profile versions, threshold settings, delivery gates, and rollback state.

Teacher operations:

- View active rule profile affecting assigned class.
- Add constraints such as max daily minutes, avoid task types, repeat vocabulary before speaking, or require teacher review for high-risk output.
- Enable low-risk auto-delivery only if tenant policy allows it.
- Trigger replan after constraint change.

Curriculum researcher operations:

- Draft rule profile.
- Attach pedagogical rationale.
- Run static regression checks against sample paths.
- Submit for admin release.

Admin operations:

- Release, rollback, or archive rule profile versions.
- View approved tenant-level policy flags from Foundational Console and manage Admin Web rule rollout within those flags.
- View rollout status and failure rate.

Safety rules:

- Internal component weights stay server-side and teacher-facing only when needed for audit.
- Student Web receives only age-appropriate reason chips from `teacher_audit_explanation.student_text`.
- Rule release or rollback writes audit log.

Acceptance:

- Changing teacher constraints does not mutate an already published path silently; it creates replan candidate/version.
- Low-risk auto-delivery requires explicit teacher enablement and sampling.

### 4.11 Research Evidence

Routes:

- `/admin/research`
- `/admin/research/:claimId`

Purpose:

Govern research claims, evidence sources, citations, and expert approval before they can be used as registry-backed support in rules, annotations, or teacher guidance.

Operations:

- Register source document.
- Extract candidate claim.
- Link claim to evidence source, citation span, and methodology notes.
- Run Citation Lint.
- Expert approve, conditionally approve, reject, or request fix.
- Publish approved claim to evidence registry.

Rules:

- Research evidence agent can propose but cannot approve registry entries.
- Citation Lint failure blocks registry publication.
- Expert conclusion cannot be overwritten by admin. Admin can reopen or assign with audit trail.

Acceptance:

- Every approved research claim has citation source, version, expert actor, timestamp, and decision status.
- Student Web does not show raw research deliberation; teacher-facing summaries are separate from internal evidence notes.

### 4.12 Monitoring

Routes:

- `/admin/monitoring`
- `/admin/monitoring/lms`
- `/admin/monitoring/audit`
- `/admin/monitoring/agents`

Purpose:

Give admins and authorized researchers Admin-business operational visibility without granting them hidden authority over teacher/expert decisions. Platform foundation views such as database health, RLS test runner, storage policy checks, tool registry, environment checks, and generated CRUD governance live in Foundational Console.

Monitoring modules:

- LMS sync status by object type, class, status, retry count, and next retry time.
- Dead-letter queue with compensation status.
- Business-scoped agent run summaries by workflow type, status, citation coverage, and guardrail result.
- Trace links to Foundational Console for detailed tool-call audit where authorized.
- ReviewCase SLA and backlog.
- Admin-business audit coverage summary.
- Read-only RLS health summary from Foundational Console test results.

Admin operations:

- Retry sync job.
- Mark compensation after external verification.
- Assign/reassign ReviewCase owner.
- Open trace details through authorized Foundational Console links.
- Request or open audit exports through the Foundational Console audit workflow.

Rules:

- Retry and compensation are operational actions; they cannot alter teacher/expert conclusions.
- Service role jobs and admin actions must write audit log.
- Dead-letter records must retain source object reference and reason code.

Acceptance:

- Failed LMS publish for a learning path does not make the student path visible unless the path is already published and deliverable inside AdaptLearn.
- Admin can see job status and audit evidence, not raw student responses unless explicitly authorized by scoped support policy.

## 5. Shared Data Contract With Student Web

### 5.1 Shared canonical tables

These tables are shared by Admin Web, Student Web, backend jobs, and agents. Student Web must access them only through safe views or API projections.

| Table | Primary producer | Admin usage | Student usage |
|---|---|---|---|
| `organizations` | Foundational Console | Tenant selection and scope display | None directly |
| `classes` | Foundational Console/LMS sync | Class diagnosis and teacher scope | Safe class label only where needed |
| `user_profiles` | Auth/Foundational Console | Staff role/scope resolution | Student own profile through safe endpoint |
| `students` | LMS sync/Foundational Console | Diagnosis, class roster | Own safe identity/profile only |
| `class_memberships` | Foundational Console/LMS sync | Teacher/student scope enforcement | RLS helper only |
| `knowledge_nodes` | Curriculum researcher | Taxonomy, annotation, diagnosis, task labels | Safe node labels only |
| `knowledge_edges` | Curriculum researcher | Taxonomy graph and recommendation | Not directly exposed |
| `taxonomy_versions` | Curriculum researcher; Foundational Console monitors | Versioning and impact checks | Version label only if needed |
| `content_versions` | Curriculum researcher | Content lifecycle and source metadata | Not directly exposed |
| `tasks` | Curriculum researcher | Task bank and assembly | Safe task projection for assigned path |
| `task_annotations` | Curriculum researcher/expert | Annotation review and task metadata | Safe labels derived from approved annotations |
| `unit_packages` | Curriculum researcher | Course/task assembly | Not directly exposed |
| `learner_profiles` | Diagnosis jobs | Diagnosis | Safe progress/profile summaries only |
| `bkt_states` | Diagnosis jobs | Teacher diagnosis | Safe mastery labels only |
| `irt_states` | Diagnosis jobs | Teacher diagnosis | No theta/standard error in student UI |
| `bloom_profiles` | Diagnosis jobs | Teacher diagnosis | Safe evidence states only |
| `thinking_profiles` | Diagnosis jobs | Teacher diagnosis | Safe dimension labels only |
| `learning_paths` | Path agent/teacher | Review, publish, audit | Own deliverable published path only |
| `path_steps` | Path agent/teacher | Path review and sequencing | Own path steps in allowed states |
| `student_submissions` | Student/API/jobs | Teacher review and evidence | Own submission status/feedback only |
| `media_uploads` | Student/API/jobs | Teacher review and upload status | Own upload status only |
| `review_cases` | Lint/verifier/jobs/staff | Queue and blocking decisions | Own high-level review-pending status only |
| `decision_traces` | Staff/jobs | Audit and path review history | Not directly exposed |
| `lms_sync_statuses` | LMS jobs/Foundational Console | Dashboard/monitoring | Limited queued/synced status only if relevant |
| `trace_events` | Jobs/Foundational Console | Monitoring trace links | Not exposed |

### 5.2 Admin-governed and Admin-consumed production tables

Admin Web owns business-governed records and consumes selected platform-foundation records. Foundational Console remains the owner for platform registry, infrastructure, environment, schema generation, and full audit/test-runner views.

| Table | Owner | Admin Web usage |
|---|---|---|
| `role_assignments` | Foundational Console | Read active staff role/class/review scopes |
| `admin_sessions` | Auth/Foundational Console | Persist server-validated active Admin scope |
| `content_drafts` | Admin Web | Draft body editing and autosave before version creation |
| `taxonomy_change_requests` | Admin Web | Proposed node/edge additions, merges, deprecations, and expert review |
| `annotation_jobs` | Admin Web / workers | AI annotation job lifecycle and QC routing |
| `rule_profiles` | Admin Web governed workflow; Foundational Console monitors | Rule profile versions, rollout state, thresholds, and release metadata |
| `teacher_constraints` | Admin Web | Teacher-specific constraints used by path recommendation |
| `research_claims` | Admin Web | Candidate and approved research claims |
| `evidence_sources` | Admin Web / RAG foundation | Source metadata and citation references used in research decisions |
| `research_review_cases` | Admin Web | Expert review lifecycle for research evidence |
| `rag_documents` | Foundational Console | Read/source-link approved RAG documents and submit source registration requests |
| `rag_chunks` | Foundational Console | Retrieve citation-backed chunks through scoped RAG APIs |
| `agent_runs` | Foundational Console / workers | Show business-scoped run summaries and trace links |
| `tool_calls` | Foundational Console / workers | Link to authorized trace details, not full tool registry management |
| `queue_jobs` | Foundational Console / workers | Show relevant business job state and retry/dead-letter links |
| `audit_logs` | Foundational Console | Show Admin-business audit timelines and links to full audit explorer |
| `lms_dead_letters` | Foundational Console / LMS jobs | Triage business-impacting sync failures and compensation status |
| `system_settings` | Foundational Console | Read approved tenant/platform flags that affect Admin Web behavior |

### 5.3 Student-safe projections

Student Web must not query canonical tables directly when a safer projection exists. Production should expose these API/view shapes:

| Projection | Source | Allowed fields |
|---|---|---|
| `student_home_view` | `students`, `learning_paths`, `path_steps` | student display label, active unit, path title, progress count, next task summary, safe sync badge |
| `student_learning_path_view` | `learning_paths`, `path_steps`, `tasks`, `teacher_audit_explanation` | path id/version, goal, step order, task title/type/minutes, status, `student_text`, safe reason chips |
| `student_task_view` | `tasks`, `path_steps`, approved annotations | prompt, response format, media refs, safe node labels, Bloom/thinking display labels, allowed hints |
| `student_feedback_view` | `student_submissions`, feedback artifacts | submission status, safe formative feedback, review pending flag, next action |
| `student_profile_summary_view` | `learner_profiles`, profile tables | Strong/Growing/Needs Practice labels, evidence sufficiency, thinking dimensions, strategy labels |
| `student_upload_status_view` | `media_uploads` | upload status, retry state, review pending flag |

Never expose to Student Web:

- `rule_evaluation.component_scores`
- internal rule weights or ranking scores
- teacher audit records
- `decision_traces`
- `review_cases` details, reason codes, owner, or decision notes
- raw BKT probability, IRT theta, standard error, calibration internals
- raw annotation confidence, lint notes, expert deliberation
- other student data
- admin/support audit logs

### 5.4 Teacher publish to Student read flow

Production publish transaction:

1. Teacher opens current `learning_paths.version` in `TEACHER_REVIEW`.
2. API checks assigned class scope and current version.
3. API checks task/content/annotation versions are approved and not blocked.
4. API checks Path Lint and Verifier. Verifier must be `PASS`.
5. API checks no unresolved blocking ReviewCase exists for the path, steps, tasks, annotations, or relevant submissions.
6. Teacher action writes `DecisionTrace`.
7. If action is `MODIFY`, a new path version is created and old version is archived/cancelled as applicable.
8. If action is `APPROVE`, path status becomes `PUBLISHED`.
9. Student-safe projection is generated or invalidated for regeneration.
10. LMS sync job is enqueued.
11. `audit_logs` records actor, role, organization, class, before/after snapshot refs, request id, and trace id.

Student read rules after publish:

- Student can read only own path where `status in ('PUBLISHED', 'IN_PROGRESS')`.
- Path must satisfy deliverability guard: verifier `PASS`, no REVIEW/BLOCK lint, no unresolved blocking ReviewCase.
- Path version in student task submission must match the current published path version.
- If path becomes withdrawn, blocked, cancelled, or stale, Student Web shows unavailable/version stale state instead of content.

### 5.5 ReviewCase blocking semantics

`review_cases` block source actions by object and severity:

| Source object | REVIEW behavior | BLOCK behavior |
|---|---|---|
| `ContentVersion` | Cannot publish content until resolved | Cannot annotate, assemble, publish, or recommend |
| `TaskAnnotation` | Cannot approve annotation until resolved | Cannot enter assembly or safe labels |
| `KnowledgeNode` / taxonomy change | Cannot publish taxonomy version until resolved | Cannot use new/changed node in annotation/recommendation |
| `UnitPackage` | Cannot publish package until resolved | Cannot enter candidate retrieval |
| `LearningPath` | Cannot publish path until resolved | Cannot publish, recommend, or update path |
| `StudentSubmission` | Student sees review pending; evidence does not update learner state until resolved | Evidence isolated; no feedback/state update until resolved |
| `MediaUpload` | Student sees review pending/upload issue | Media evidence isolated |
| `LmsSync` | Local object may remain valid; sync is retried or compensated | Dead-letter/compensation required |
| `ResearchClaim` | Cannot enter evidence registry | Cannot be used by rules/teacher guidance |

Unresolved blocking statuses:

- `OPEN`
- `ASSIGNED`
- `IN_REVIEW`
- `NEEDS_FIX`
- `REOPENED`
- `BLOCKED_FINAL`

## 6. Supabase / RLS Specification

This section defines Admin Web product-policy requirements for shared RLS. The Foundational Console owns the RLS policy viewer, scoped test runner, helper-function diagnostics, browser/service-role separation checks, and platform readiness reporting.

### 6.1 Auth claims and helper functions

Required JWT/profile fields:

- `auth.uid()`
- `organization_id`
- active `role`
- optional active `class_id`
- optional active `review_scope`

Recommended SQL helper functions:

- `current_app_user_id()`
- `current_organization_id()`
- `current_role()`
- `is_org_member(org_id uuid)`
- `has_role(role text)`
- `is_assigned_teacher(class_id uuid)`
- `is_student_owner(student_id uuid)`
- `can_read_student_in_class(class_id uuid)`
- `can_manage_content(org_id uuid)`
- `can_manage_taxonomy(org_id uuid)`
- `can_access_review_case(review_case_id uuid)`
- `can_admin_monitor(org_id uuid)`
- `write_audit_log(...)` exposed only through trusted RPC/service role

### 6.2 RLS policy matrix

| Table group | Student | Teacher | Curriculum researcher | Expert | Admin | Service role |
|---|---|---|---|---|---|---|
| Org/profile | Own safe profile | Own org/profile | Own org/profile | Own org/profile | Read active Admin scope; platform management via Foundation | Full with audit |
| Classes/memberships | Own class safe label | Assigned classes only | Aggregate/content scope only | No default | Support metadata and scoped assignment views; baseline management via Foundation | Full with audit |
| Students | Own row safe projection | Assigned classes only | Aggregate or governed case only | Governed case only | Scoped support metadata only | Full with audit |
| Content/task/taxonomy | Read safe task projection only | Read approved content/tasks | Create/edit/archive/review | Review high-risk/expert items | Release workflow metadata | Full with audit |
| Annotations | Safe labels only | Read teacher-facing explanation | Create/review/modify | Approve assigned/high-risk | Configure workflow only | Full with audit |
| Diagnosis/profile states | Own safe summaries | Full assigned class diagnosis | Aggregate QA only | Governed evidence review only | Operational metadata only | Full with audit |
| Learning paths | Own deliverable paths | Assigned class review/publish | No final learner decision | No final learner decision | No silent override | Full with audit |
| Student submissions/media | Own status and feedback | Assigned class evidence/review | No unrestricted access | Assigned/high-risk case only | Support metadata only | Full with audit |
| ReviewCases | Own review-pending status only | Assigned path/output cases | Content/annotation/taxonomy cases | Assigned/high-risk cases | Assign/monitor/reopen only | Full with audit |
| Rules/constraints | No | Own teacher constraints | Draft/review rule profiles | Advisory/read | Release/rollback metadata | Full with audit |
| Research evidence | Approved summaries only if exposed | Approved teacher summaries | Manage claims/matrix | Approve/reject | Monitor/assign only | Full with audit |
| LMS/monitoring/audit | Own limited sync status | Assigned class sync status | Quality sync status | No default | Monitoring/audit visibility | Full with audit |

### 6.3 Teacher policies

Teachers may:

- Read classes where `class_memberships.user_id = auth.uid()` and role is teacher.
- Read students and learner profiles for assigned classes.
- Read submissions/media for assigned classes when needed for diagnosis, feedback, or ReviewCase.
- Create path review decisions for assigned classes.
- Create/update `teacher_constraints` for assigned classes.
- Read relevant content/tasks/annotations in approved or teacher-visible states.

Teachers may not:

- Read unassigned classes or students.
- Update learner profile states directly.
- Publish a path with unresolved REVIEW/BLOCK.
- Modify/reject/replan without reason.
- Update `decision_traces` after creation.

### 6.4 Curriculum researcher policies

Curriculum researchers may:

- Manage `content_versions`, `content_drafts`, `tasks`, `task_annotations`, `knowledge_nodes`, `knowledge_edges`, `taxonomy_versions`, and `unit_packages`.
- Register or request RAG source usage through Foundation-owned ingestion and retrieve citation-backed chunks through scoped APIs.
- Read aggregate QA metrics and content-related ReviewCases.
- Access student submission snippets only when a ReviewCase specifically assigns that object for content/annotation diagnosis, and only with redaction.

Curriculum researchers may not:

- Browse all student submissions.
- Make final teacher path publish decisions.
- Override teacher constraints for a learner path.
- Approve high-risk expert-only cases unless also granted expert role context.

### 6.5 Expert policies

Experts may:

- Read and decide assigned or eligible high-risk ReviewCases.
- Review high-risk annotations, taxonomy changes, and research evidence.
- Read only the object snapshots required by the case.

Experts may not:

- Browse unrelated student data.
- Publish student paths.
- Release rule profiles as admin.
- Edit teacher decisions.

### 6.6 Admin policies

Admins may:

- Manage Admin Web workflow assignments, business monitoring, audit visibility links, and dead-letter triage operations.
- Use Foundational Console for organization, role, RLS, tool registry, queue backend, environment, and schema-generation administration.
- Assign/reassign ReviewCases.
- Reopen cases with reason.
- Release/rollback rule profiles after required review checks.

Admins may not:

- Silently change `learning_paths` from review/rejected/blocked to published.
- Edit `decision_traces`.
- Change expert conclusions without reopening the governed case.
- Directly update learner profile state from the Admin UI.
- Read raw student responses unless scoped support access is explicitly granted and audited.

### 6.7 Service role job policies

Service role jobs may write system-owned tables only through backend code paths that provide:

- `job_id`
- `workflow_type`
- `initiated_by`
- `request_id`
- `trace_id`
- `organization_id`
- `object_type`
- `object_id`
- before/after snapshot refs when mutating business state

Every service role write must create one of:

- `audit_logs` for business/security writes
- `agent_runs` plus `tool_calls` for agent work
- `queue_jobs` state transition for background jobs
- `lms_sync_statuses` transition for LMS sync

## 7. API Contracts

### 7.1 API conventions

All Admin API endpoints use:

- Base path: `/v1/admin`
- Auth: Supabase Auth token validated by FastAPI middleware
- Required headers for writes:
  - `Idempotency-Key` for non-idempotent writes
  - `X-Request-Id`
- Standard error shape:

```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "User is not assigned to this class.",
    "trace_id": "trc_..."
  }
}
```

Standard write response fields:

- `object_id`
- `status`
- `version`
- `decision_trace_id` when a human/system decision is recorded
- `review_case_id` when REVIEW/BLOCK is created
- `audit_log_id`
- `trace_id`

### 7.2 Auth and organization

| Method | Path | Roles | Request | Response | Side effects |
|---|---|---|---|---|---|
| `GET` | `/v1/admin/me` | Staff | None | Profile, available roles, organizations, class scopes, review scopes | Audit auth-sensitive read |
| `POST` | `/v1/admin/session/scope` | Staff | `{ organization_id, role, class_id?, review_scope? }` | Active scope and allowed routes | Write `admin_sessions`, audit |
| `GET` | `/v1/admin/organizations` | Staff | Query filters | Organizations user can access | None |

### 7.3 Dashboard

| Method | Path | Roles | Request | Response |
|---|---|---|---|---|
| `GET` | `/v1/admin/dashboard` | Staff | `role`, `organization_id`, optional `class_id` | Role-specific cards, queues, recent decisions, sync summary |
| `GET` | `/v1/admin/dashboard/queues` | Staff | Queue filters | Counts and top items scoped to role |
| `GET` | `/v1/admin/dashboard/recent-decisions` | Teacher/admin | Scope filters | Human-readable decisions, actor, object label, time |

Dashboard response must use teacher/researcher-friendly labels as primary text and keep internal IDs secondary.

### 7.4 Content CRUD

| Method | Path | Roles | Request | Response | Side effects |
|---|---|---|---|---|---|
| `GET` | `/v1/admin/content` | Teacher, researcher | Filters by unit/module/status | Content list with source/version metadata | None |
| `POST` | `/v1/admin/content` | Researcher | Draft fields | Created content draft/version | Audit |
| `GET` | `/v1/admin/content/{id}` | Teacher, researcher | None | Content detail and version history | Audit sensitive read if source doc restricted |
| `PATCH` | `/v1/admin/content/{id}` | Researcher | Editable draft fields | Updated version | Audit |
| `POST` | `/v1/admin/content/{id}/submit-lint` | Researcher | `{ lint_profile_id }` | Lint status and ReviewCase if needed | `queue_jobs`, audit |
| `POST` | `/v1/admin/content/{id}/submit-annotation` | Researcher | `{ annotation_profile_id }` | Annotation job | `annotation_jobs`, `agent_runs` |
| `POST` | `/v1/admin/content/{id}/publish` | Researcher | `{ reason? }` | Published locked version or blocking case | `DecisionTrace`, audit |
| `POST` | `/v1/admin/content/{id}/archive` | Researcher | `{ reason }` | Archived version | `DecisionTrace`, audit |

### 7.5 Taxonomy / knowledge graph CRUD

| Method | Path | Roles | Request | Response | Side effects |
|---|---|---|---|---|---|
| `GET` | `/v1/admin/taxonomy/tree` | Teacher, researcher, expert | `unit_id`, `version_id?`, `expanded_node_id?` | Multi-level tree with task/reference counts | None |
| `POST` | `/v1/admin/taxonomy/nodes` | Researcher | Node draft | Created node/change request | Audit |
| `PATCH` | `/v1/admin/taxonomy/nodes/{nodeId}` | Researcher | Node edits | Updated draft/change request | Audit |
| `POST` | `/v1/admin/taxonomy/nodes/{nodeId}/deprecate` | Researcher | `{ reason, replacement_node_id? }` | Deprecation request | ReviewCase if high impact |
| `POST` | `/v1/admin/taxonomy/nodes/{nodeId}/merge` | Researcher/expert | `{ target_node_id, reason }` | Merge request/result | ReviewCase if high impact |
| `POST` | `/v1/admin/taxonomy/edges` | Researcher | Edge draft | Created edge/change request | Audit |
| `DELETE` | `/v1/admin/taxonomy/edges/{edgeId}` | Researcher | `{ reason }` | Edge removed/deprecated | Audit |
| `POST` | `/v1/admin/taxonomy/versions/{versionId}/publish` | Researcher/admin | `{ reason }` | Published taxonomy version | `DecisionTrace`, audit |

### 7.6 Task and annotation CRUD

| Method | Path | Roles | Request | Response | Side effects |
|---|---|---|---|---|---|
| `GET` | `/v1/admin/tasks` | Teacher, researcher | Filters | Task list with approved annotation summary | None |
| `POST` | `/v1/admin/tasks` | Researcher | Task draft | Created task | Audit |
| `PATCH` | `/v1/admin/tasks/{taskId}` | Researcher | Editable fields | Updated task draft/version | Audit |
| `POST` | `/v1/admin/tasks/{taskId}/archive` | Researcher | `{ reason }` | Archived task | `DecisionTrace`, audit |
| `GET` | `/v1/admin/annotations` | Researcher, expert | Filters | Annotation queue/list | None |
| `GET` | `/v1/admin/annotations/{annotationId}` | Researcher, expert | None | Annotation detail, evidence, QC status | Audit sensitive read |
| `POST` | `/v1/admin/annotations/{annotationId}/accept` | Researcher/expert | `{ reason? }` | Approved annotation | `DecisionTrace`, audit |
| `POST` | `/v1/admin/annotations/{annotationId}/modify` | Researcher/expert | `{ changes, reason }` | New annotation version | `DecisionTrace`, audit |
| `POST` | `/v1/admin/annotations/{annotationId}/return` | Researcher/expert | `{ reason }` | Relabel job | ReviewCase/agent job |
| `POST` | `/v1/admin/annotations/{annotationId}/block` | Researcher/expert | `{ reason }` | Blocked annotation | `DecisionTrace`, ReviewCase, audit |

### 7.7 Course and task assembly

| Method | Path | Roles | Request | Response | Side effects |
|---|---|---|---|---|---|
| `GET` | `/v1/admin/packages` | Teacher, researcher | Filters | Package list | None |
| `POST` | `/v1/admin/packages` | Researcher | Package draft | Created package | Audit |
| `PATCH` | `/v1/admin/packages/{packageId}` | Researcher | Task sequence/settings | Updated draft | Audit |
| `POST` | `/v1/admin/packages/{packageId}/lint` | Researcher | `{ lint_profile_id }` | Lint result | ReviewCase if REVIEW/BLOCK |
| `POST` | `/v1/admin/packages/{packageId}/publish` | Researcher | `{ reason }` | Published locked package | `DecisionTrace`, audit |

### 7.8 Class diagnosis

| Method | Path | Roles | Request | Response |
|---|---|---|---|---|
| `GET` | `/v1/admin/classes/{classId}/diagnosis` | Teacher | Filters by unit/node/status | Class diagnosis summary, evidence sufficiency, path status |
| `GET` | `/v1/admin/students/{learnerId}/diagnosis` | Teacher | `unit_id`, optional node filters | Learner profile, BKT/IRT/Bloom/thinking panels, evidence refs |
| `POST` | `/v1/admin/students/{learnerId}/diagnosis/refresh` | Teacher | `{ reason? }` | Queued diagnosis summarizer job | `agent_runs`, audit |
| `POST` | `/v1/admin/students/{learnerId}/review-case` | Teacher | `{ object_ref, severity, reason_codes }` | ReviewCase | Audit |

### 7.9 Path review actions

| Method | Path | Roles | Request | Response | Side effects |
|---|---|---|---|---|---|
| `POST` | `/v1/admin/students/{learnerId}/paths/generate` | Teacher | `{ unit_id, constraints? }` | Candidate path in teacher review or ReviewCase | `agent_runs`, audit |
| `GET` | `/v1/admin/paths/{pathId}/review` | Teacher | None | Path review view, evidence, rules, verifier, cases | Audit sensitive read |
| `POST` | `/v1/admin/paths/{pathId}/approve` | Teacher | `{ path_version, reason? }` | Published path or blocking error | `DecisionTrace`, LMS job, audit |
| `POST` | `/v1/admin/paths/{pathId}/modify` | Teacher | `{ path_version, changes, reason }` | New path version and review status/published status | `DecisionTrace`, audit |
| `POST` | `/v1/admin/paths/{pathId}/reject` | Teacher | `{ path_version, reason }` | Rejected/cancelled path | `DecisionTrace`, audit |
| `POST` | `/v1/admin/paths/{pathId}/replan` | Teacher | `{ path_version, constraints?, reason }` | Replan job/path version | `DecisionTrace`, `agent_runs`, audit |
| `POST` | `/v1/admin/paths/{pathId}/publish` | Teacher | `{ path_version }` | Published path if guard passes | `DecisionTrace`, LMS job, audit |

Path action errors:

- `PATH_VERSION_STALE`
- `BLOCKING_REVIEW_CASE`
- `VERIFIER_NOT_PASS`
- `LINT_BLOCKING`
- `TASK_VERSION_INVALID`
- `MISSING_TEACHER_REASON`
- `CLASS_SCOPE_DENIED`

### 7.10 ReviewCase queue actions

| Method | Path | Roles | Request | Response | Side effects |
|---|---|---|---|---|---|
| `GET` | `/v1/admin/review-cases` | Staff | Filters | Scoped queue with human-readable labels | None |
| `GET` | `/v1/admin/review-cases/{id}` | Staff scoped | None | Case detail and source snapshot | Audit sensitive read |
| `POST` | `/v1/admin/review-cases/{id}/assign` | Admin/eligible lead | `{ owner_user_id, reason }` | Assigned case | Audit |
| `POST` | `/v1/admin/review-cases/{id}/claim` | Eligible staff | `{ reason? }` | Assigned case | Audit |
| `POST` | `/v1/admin/review-cases/{id}/approve` | Scoped owner | `{ conclusion, reason? }` | Approved/resolved case | `DecisionTrace`, audit |
| `POST` | `/v1/admin/review-cases/{id}/condition` | Scoped owner | `{ condition, reason }` | Conditionally approved | `DecisionTrace`, audit |
| `POST` | `/v1/admin/review-cases/{id}/request-fix` | Scoped owner | `{ fix_request, reason }` | Needs fix | `DecisionTrace`, audit |
| `POST` | `/v1/admin/review-cases/{id}/reject` | Scoped owner | `{ reason }` | Rejected | `DecisionTrace`, audit |
| `POST` | `/v1/admin/review-cases/{id}/block` | Scoped owner | `{ reason }` | Blocked final | `DecisionTrace`, audit |
| `POST` | `/v1/admin/review-cases/{id}/reopen` | Admin/scoped owner | `{ reason }` | Reopened | `DecisionTrace`, audit |

### 7.11 Rules settings

| Method | Path | Roles | Request | Response | Side effects |
|---|---|---|---|---|---|
| `GET` | `/v1/admin/rules/profiles` | Teacher, researcher, admin | Filters | Rule profiles with rollout status | None |
| `POST` | `/v1/admin/rules/profiles` | Researcher | Draft profile | Created rule profile | Audit |
| `PATCH` | `/v1/admin/rules/profiles/{id}` | Researcher | Draft changes | Updated profile | Audit |
| `POST` | `/v1/admin/rules/profiles/{id}/test` | Researcher/admin | Test settings | Static regression result | `agent_runs` or queue job |
| `POST` | `/v1/admin/rules/profiles/{id}/release` | Admin | `{ reason }` | Released version | `DecisionTrace`, audit |
| `POST` | `/v1/admin/rules/profiles/{id}/rollback` | Admin | `{ reason }` | Rolled back version | `DecisionTrace`, audit |
| `GET` | `/v1/admin/classes/{classId}/constraints` | Teacher | None | Teacher constraints | None |
| `PATCH` | `/v1/admin/classes/{classId}/constraints` | Teacher | Constraint changes | Updated constraints and affected path count | Audit |

### 7.12 Research evidence

| Method | Path | Roles | Request | Response | Side effects |
|---|---|---|---|---|---|
| `GET` | `/v1/admin/research/claims` | Researcher, expert | Filters | Claim list and status | None |
| `POST` | `/v1/admin/research/claims` | Researcher | Claim draft/source refs | Created claim | Audit |
| `PATCH` | `/v1/admin/research/claims/{id}` | Researcher | Draft edits | Updated claim | Audit |
| `POST` | `/v1/admin/research/claims/{id}/lint` | Researcher | `{ citation_profile_id }` | Citation lint result | ReviewCase if blocking |
| `POST` | `/v1/admin/research/claims/{id}/expert-decision` | Expert | `{ decision, reason, conditions? }` | Expert conclusion | `DecisionTrace`, audit |
| `POST` | `/v1/admin/research/claims/{id}/publish` | Researcher/admin | `{ reason }` | Registry entry if approved | Audit |
| `POST` | `/v1/admin/research/sources` | Researcher/admin | Source metadata/upload ref | Source registration request and Foundation RAG ingestion job reference | `queue_jobs`, `agent_runs` through Foundation pipeline |

### 7.13 Monitoring and LMS sync

| Method | Path | Roles | Request | Response | Side effects |
|---|---|---|---|---|---|
| `GET` | `/v1/admin/monitoring/summary` | Admin, researcher | Filters | Workflow, queue, sync, review summary | None |
| `GET` | `/v1/admin/monitoring/lms` | Teacher/admin/researcher scoped | Filters | Business-scoped sync statuses from the Foundation-owned LMS connector | None |
| `POST` | `/v1/admin/monitoring/lms/{syncId}/retry` | Admin/teacher scoped | `{ reason }` | Retry queued | `queue_jobs`, audit |
| `POST` | `/v1/admin/monitoring/lms/{syncId}/compensate` | Admin | `{ compensation_note, reason }` | Compensated status | `DecisionTrace`, audit |
| `GET` | `/v1/admin/monitoring/dead-letters` | Admin | Filters | Dead-letter jobs | None |
| `GET` | `/v1/admin/monitoring/agent-runs` | Admin/researcher scoped | Filters | Business-scoped agent run summaries with Foundation trace links | None |
| `GET` | `/v1/admin/monitoring/audit-logs` | Admin | Filters | Admin-business audit timeline with Foundation audit explorer links | Audit read |

## 8. Agent Workflow Specification

This section defines Admin business workflow contracts. The Foundational Console owns workflow registry records, prompt/model version registry, tool schema registry, queue backend health, and full tool-call trace exploration.

### 8.1 Common agent rules

All agents must:

- Run server-side only.
- Use scoped service credentials, never browser credentials.
- Create `agent_runs` before work starts.
- Record each retrieval/API/model call in `tool_calls`.
- Store prompt version, model id, input refs, output refs, citations, latency, token usage, guardrail result, and status.
- Return structured outputs validated by schemas.
- Create ReviewCase when guardrail/lint/verifier emits REVIEW/BLOCK.
- Never write student-visible text without safe-output projection.
- Never approve their own high-risk output.

### 8.2 Content annotation agent

| Field | Contract |
|---|---|
| Trigger | Content draft submitted to annotation or task changed |
| Tools | `rag_search`, `taxonomy_tree_read`, `task_parser`, `annotation_candidate_writer`, `lint_runner`, `review_case_creator` |
| Permissions | Read content/task/taxonomy/RAG source in org; write candidate annotations and agent logs only |
| Inputs | Content version, task draft, taxonomy version, source refs, allowed label space, annotation profile |
| Outputs | Candidate `TaskAnnotation`, evidence locations, confidence, lint status, reason codes |
| Human fallback | Curriculum researcher reviews medium/low confidence; expert reviews high-risk/new-label cases |

Guardrails:

- Agent can propose but cannot approve formal labels.
- Candidate labels must come from approved taxonomy version unless routed as new-node request.
- BLOCK prevents assembly.

### 8.3 Path recommendation and verifier agent

| Field | Contract |
|---|---|
| Trigger | Teacher requests path, learner state updates, teacher constraints change, or replan requested |
| Tools | `learner_profile_reader`, `task_search`, `rule_evaluator`, `constraint_checker`, `path_assembler`, `path_lint_runner`, `verifier`, `review_case_creator` |
| Permissions | Read learner profile for assigned class through backend scope; read approved tasks/annotations/rules; write candidate path/agent logs |
| Inputs | Learner id, class id, unit id, approved task pool, teacher constraints, rule profile, diagnosis summary, excluded tasks |
| Outputs | Candidate `LearningPath`, `PathStep[]`, `RuleEvaluation`, `VerifierResult`, teacher/student explanation drafts |
| Human fallback | Teacher review is required unless explicit low-risk auto-delivery is enabled and sampled |

Guardrails:

- Verifier `REPLAN`, `REVIEW`, or `BLOCK` prevents publish.
- Candidate path cannot include blocked tasks or unapproved annotations.
- Teacher action is required for publish in default production mode.

### 8.4 Diagnosis summarizer

| Field | Contract |
|---|---|
| Trigger | New qualified evidence, teacher refresh, scheduled profile update |
| Tools | `submission_reader`, `evidence_lint_runner`, `bkt_updater`, `irt_updater`, `bloom_aggregator`, `thinking_rubric_aggregator`, `profile_summary_writer` |
| Permissions | Read scoped learner evidence; write learner profile states through service role; write audit/agent logs |
| Inputs | Student submissions, task annotations, previous profile state, parameter versions, evidence quality status |
| Outputs | Updated learner profiles, evidence sufficiency labels, safe teacher diagnosis summary |
| Human fallback | Evidence lint failure or high-risk output creates ReviewCase for teacher/expert as applicable |

Guardrails:

- Data Lint must pass before learner state updates.
- Low-confidence summaries must remain tentative.
- Student-safe summary cannot include raw probabilities or exact ranks.

### 8.5 ReviewCase triage agent

| Field | Contract |
|---|---|
| Trigger | REVIEW/BLOCK created by lint, verifier, agent, LMS job, or staff action |
| Tools | `source_snapshot_reader`, `risk_reason_normalizer`, `owner_router`, `sla_calculator`, `queue_writer` |
| Permissions | Read minimal source object snapshot; write ReviewCase assignment suggestions/status logs |
| Inputs | Object type/id, severity, reason codes, risk level, organization/class, source version |
| Outputs | Owner recommendation, queue category, deadline, teacher/researcher-readable summary |
| Human fallback | Assigned teacher/researcher/expert/admin makes final conclusion |

Guardrails:

- Agent cannot resolve the case.
- Source snapshot must be version-bound.
- Student submission content is redacted unless the assigned human role can read it.

### 8.6 Research evidence agent

| Field | Contract |
|---|---|
| Trigger | RAG source ingested, researcher creates claim, citation lint requested |
| Tools | `rag_search`, `citation_extractor`, `claim_normalizer`, `evidence_matrix_builder`, `citation_lint_runner`, `review_case_creator` |
| Permissions | Read RAG docs/chunks and research claims; write candidate evidence matrix and agent logs |
| Inputs | Source docs, claim draft, citation policy, research domain tags |
| Outputs | Candidate claim/evidence links, citation spans, confidence/risk, lint status |
| Human fallback | Expert approves, conditionally approves, rejects, or requests fix |

Guardrails:

- Agent cannot publish evidence registry entries.
- Citation Lint BLOCK prevents rule/teacher guidance usage.

### 8.7 LMS sync agent

| Field | Contract |
|---|---|
| Trigger | Path publish, submission status update, grade/feedback summary ready, scheduled roster sync, manual retry |
| Tools | `lms_adapter`, `sync_payload_builder`, `idempotency_checker`, `retry_scheduler`, `dead_letter_writer`, `review_case_creator` |
| Permissions | Read scoped object payload; write sync statuses, queue jobs, audit logs |
| Inputs | Object type/id, external mapping, sync direction, payload version, retry policy |
| Outputs | `lms_sync_statuses`, external id, retry/dead-letter state, compensation record |
| Human fallback | Admin or assigned teacher handles dead-letter/compensation ReviewCase |

Guardrails:

- Adapter configuration, including `MockLmsAdapter` and future OAuth credentials, is owned by Foundational Console.
- LMS failure cannot make an unpublished path visible to students.
- Retries must be idempotent.
- Dead-letter creates monitoring item and, if business-blocking, ReviewCase.

## 9. Frontend Implementation Guidance

### 9.1 Next.js route plan

Recommended App Router layout:

```text
apps/admin-web/
  app/
    (auth)/
      admin/login/page.tsx
      admin/org/page.tsx
    admin/
      layout.tsx
      page.tsx
      content/page.tsx
      content/[contentVersionId]/page.tsx
      taxonomy/page.tsx
      taxonomy/[nodeId]/page.tsx
      annotations/page.tsx
      annotations/[annotationId]/page.tsx
      assembly/page.tsx
      assembly/[packageId]/page.tsx
      classes/[classId]/diagnosis/page.tsx
      students/[learnerId]/diagnosis/page.tsx
      paths/[pathId]/review/page.tsx
      review-cases/page.tsx
      review-cases/[reviewCaseId]/page.tsx
      rules/page.tsx
      rules/[ruleProfileId]/page.tsx
      research/page.tsx
      research/[claimId]/page.tsx
      monitoring/page.tsx
```

### 9.2 UI design direction

Admin Web should be desktop-first and dense:

- Use tables, split panes, filters, drawers, tabs, and compact cards.
- Prefer human-readable names as primary row labels; keep IDs in copyable secondary metadata.
- Use sticky table headers, column visibility, saved filters, bulk actions where safe, and keyboard-accessible rows.
- Use explicit status badges for REVIEW, BLOCK, PUBLISHED, VERSION STALE, DEAD LETTER, and REVIEW PENDING.
- Use evidence drawers instead of navigating away from review tasks.
- Use side-by-side before/after panels for teacher path modifications and taxonomy changes.
- Avoid marketing-style hero sections. Admin surfaces should feel operational and scan-friendly.

Responsive behavior:

- Primary target: desktop/laptop.
- Tablet supported with two-column layouts collapsing to stacked panels.
- Mobile can show read-only or emergency queue views, but production editing/review is desktop-first.

### 9.3 Component hierarchy

Suggested feature modules:

```text
features/
  auth-scope/
  dashboard/
  content/
  taxonomy/
  annotations/
  assembly/
  diagnosis/
  path-review/
  review-cases/
  rules/
  research/
  monitoring/
components/
  data-table/
  evidence-drawer/
  decision-panel/
  status-badge/
  version-history/
  source-snapshot/
  audit-timeline/
  taxonomy-tree/
  task-sequence-builder/
  rule-diff/
```

Core shared components:

- `ScopedPageShell`
- `RoleGuard`
- `PermissionDeniedState`
- `WorkQueueTable`
- `ReviewCaseBadge`
- `DecisionTraceTimeline`
- `ReasonRequiredDialog`
- `EvidenceDrawer`
- `SourceSnapshotPanel`
- `TaxonomyTreeGrid`
- `PathStepEditor`
- `SafeProjectionPreview`
- `AuditLogLink`

### 9.4 State management

Recommended approach:

- Use server components for shell and initial scoped data when possible.
- Use TanStack Query for server state, caching, mutations, invalidation, and optimistic-free writes.
- Use Zustand only for local UI state that spans panels, such as active filters, drawer state, selected path step, or taxonomy expansion.
- Use React Hook Form plus Zod for forms and validation.
- Generate TypeScript types from OpenAPI/Pydantic/Zod schemas.
- Do not keep authoritative business state only in client stores.

Mutation principles:

- Writes call explicit action endpoints rather than generic table patching.
- Every write mutation displays resulting status, DecisionTrace id, ReviewCase id, or blocking error.
- Teacher decisions must use a reason dialog when required.
- Version conflicts invalidate query and show refresh CTA.

### 9.5 CRUD generation strategy

CRUD can be partially generated for low-risk admin resources, but governed workflows need hand-authored action panels.

Generate:

- Basic list/detail forms for content drafts, task drafts, source docs, research claim drafts, and system metadata.
- Field schemas, enums, required labels, and validation from shared schema metadata.
- Filter controls and table columns from API metadata where possible.

Hand-author:

- Path review actions.
- ReviewCase decisions.
- Taxonomy merge/deprecate impact review.
- Annotation accept/modify/block.
- Rule release/rollback.
- LMS compensation.

### 9.6 Testing

Frontend tests:

- Role route guards.
- Dashboard scoped counts.
- Path approve/modify/reject/replan decision forms.
- BLOCK and REVIEW publish blocking states.
- ReviewCase queue actions.
- Taxonomy node CRUD and expand/collapse.
- Student-safe projection preview does not show banned fields.

Backend/API tests:

- RLS policy tests for each role.
- API permission tests for assigned/unassigned class.
- Teacher decision reason tests.
- Publish guard tests.
- ReviewCase blocking tests.
- Service-role audit log tests.
- LMS retry/dead-letter idempotency tests.

## 10. Acceptance Criteria

Functional acceptance:

- Teacher can view assigned class diagnosis and cannot access unassigned classes.
- Teacher can approve, modify, reject, and replan paths.
- Every teacher approve/modify/reject/replan action creates `DecisionTrace`.
- MODIFY, REJECT, and REPLAN require non-empty reason.
- Manual path modification creates a new path version.
- Teacher publish creates or updates student-safe projection and enqueues LMS sync.
- `BLOCK` cannot publish, recommend, or update student state.
- `REVIEW` must create ReviewCase.
- Unresolved blocking ReviewCase prevents source flow publish/recommend/update.
- Student cannot see internal rule weights, teacher audit records, DecisionTrace, ReviewCase details, expert deliberation, raw BKT/IRT values, or other student data.
- Curriculum researcher can manage content, task bank, taxonomy, annotation, research claims, and governed RAG source usage without unrestricted student submission access.
- Expert can process assigned/high-risk ReviewCases and research evidence without broad student browsing.
- Admin can view monitoring, LMS sync, dead-letter, and audit logs but cannot silently overwrite teacher/expert decisions.
- Service role jobs write audit/agent/tool/queue logs as required.

Data acceptance:

- Published content/task/package/path versions are immutable.
- REVIEW/BLOCK cases include object type, object id, source version, reason codes, severity, owner or assignment rule, status, and deadline when applicable.
- DecisionTrace includes actor, action, reason requirement, reason text when required, before/after snapshot refs, versions, and timestamp.
- Student submissions include path id, path version, task id, learner id, status, response payload ref, evidence ids, and idempotency key.
- Taxonomy changes preserve version history and impact mappings.

Security acceptance:

- RLS enforces assigned class access for teachers.
- RLS prevents curriculum researchers from broad student submission reads.
- RLS limits experts to assigned/high-risk cases.
- RLS prevents browser clients from using service-role behavior.
- Audit logs cover auth-sensitive reads and all writes.

Compatibility acceptance:

- Admin spec does not conflict with `13_STUDENT_WEB_SPEC.md`.
- Admin spec does not duplicate the platform-foundation responsibilities in `16_FOUNDATIONAL_CONSOLE_SPEC.md`.
- Student Web still reads only own valid published deliverable paths.
- Shared schemas remain compatible with `prototype/shared/src/schemas/core.ts` or are introduced as additive production tables/views.
- API error states map to Student Web states such as review pending, version stale, queued sync, offline unavailable, and completed.

## 11. Decisions That Affect Student Implementation

These shared schema/RLS/API decisions must be reflected in Student Web implementation:

1. Student Web must read through safe API projections, not canonical admin tables.
2. Student path reads are limited to own `LearningPath` rows where status is `PUBLISHED` or `IN_PROGRESS` and deliverability guard passes.
3. `LearningPath` production storage should split header and steps into `learning_paths` and `path_steps`, while preserving the shared schema shape returned to Student Web.
4. `teacher_audit_explanation.student_text` is the only path explanation field allowed for Student Web. Teacher-only text, rule refs, excluded task refs, and component scores stay hidden.
5. Student task view must hide `answer_key_or_rubric` until feedback logic produces a safe response.
6. Student profile must convert BKT/IRT/Bloom/thinking internals into safe labels and evidence sufficiency summaries.
7. Student submission API must require `path_id`, `path_version`, `task_id`, `learner_id`, and `idempotency_key`.
8. Student submissions cannot update learner state until Data/Output Lint passes.
9. If a StudentSubmission or MediaUpload enters REVIEW, Student Web shows review pending without ReviewCase details.
10. If a source object is BLOCKED, Student Web receives unavailable/version stale/review pending states, never the internal block reason details.
11. ReviewCase existence blocks publish/recommend/update, so Student Web must handle no-valid-path and version-stale states gracefully.
12. LMS sync is separate from AdaptLearn publish. Student Web should not depend on LMS sync success to read an already published AdaptLearn path.
13. Taxonomy node edits are versioned. Student Web should display labels from the path/task version snapshot, not live mutable node labels.
14. RLS helper functions for student ownership and teacher assigned class are shared infrastructure and must be tested with both admin and student endpoints.
15. DecisionTrace remains admin/audit-only. Student Web can show safe status text derived from decisions, but never the audit record itself.

## 12. References

- `docs/prototype/01_PROTOTYPE_BRIEF.md`
- `docs/prototype/02_INFORMATION_ARCHITECTURE.md`
- `docs/prototype/03_SCREEN_INVENTORY.md`
- `docs/prototype/04_ROUTE_MAP.md`
- `docs/prototype/05_FLOW_INDEX.md`
- `docs/prototype/06_STATE_MATRIX.md`
- `docs/prototype/08_ROLE_PERMISSION_MATRIX.md`
- `docs/prototype/09_MOCK_DATA_CONTRACT.md`
- `docs/prototype/13_STUDENT_WEB_SPEC.md`
- `docs/prototype/14_PRODUCTION_IMPLEMENTATION_SPEC.md`
- `docs/prototype/16_FOUNDATIONAL_CONSOLE_SPEC.md`
- `prototype/shared/src/schemas/core.ts`
