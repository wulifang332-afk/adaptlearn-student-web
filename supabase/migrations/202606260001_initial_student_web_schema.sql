-- AdaptLearn Student Web production skeleton schema.
-- Target: Supabase Cloud, region ap-northeast-1, pgvector enabled in schema extensions.

create schema if not exists extensions;
create extension if not exists vector with schema extensions;
create extension if not exists pgcrypto with schema extensions;

do $$
begin
  create type public.user_role as enum ('student', 'teacher', 'curriculum_researcher', 'expert', 'admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.path_step_status as enum ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'REVIEW_PENDING', 'WITHDRAWN');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.submission_status as enum ('DRAFT', 'SUBMITTING', 'QUEUED_OFFLINE', 'RECEIVED', 'LINT_PASS', 'ISOLATED', 'REVIEW_PENDING', 'APPLIED', 'COMPLETED');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.media_upload_status as enum ('PERMISSION_REQUIRED', 'RECORDING', 'RECORDED', 'UPLOADING', 'QUEUED_OFFLINE', 'UPLOADED', 'FAILED', 'REVIEW_PENDING');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.review_case_status as enum ('OPEN', 'ASSIGNED', 'IN_REVIEW', 'NEEDS_FIX', 'APPROVED', 'CONDITIONALLY_APPROVED', 'REJECTED', 'BLOCKED_FINAL', 'RESOLVED', 'REOPENED');
exception when duplicate_object then null;
end $$;

create table if not exists public.organizations (
  id text primary key,
  name text not null,
  region_label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete restrict,
  grade text not null,
  subject text not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  constraint classes_grade_subject_check check (grade <> '' and subject <> '')
);

create table if not exists public.user_profiles (
  id uuid primary key,
  role public.user_role not null,
  display_name text not null,
  organization_id text not null references public.organizations(id) on delete restrict,
  class_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.user_profiles.id is 'Matches Supabase auth.users.id. Seed data may use mock UUIDs until real auth users exist.';

create table if not exists public.students (
  id text primary key,
  user_id uuid unique references public.user_profiles(id) on delete set null,
  class_id text not null references public.classes(id) on delete restrict,
  pseudonymous_label text not null,
  persona_id text not null check (persona_id in ('persona_a', 'persona_b', 'persona_c')),
  created_at timestamptz not null default now()
);

create table if not exists public.class_memberships (
  class_id text not null references public.classes(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  member_role public.user_role not null,
  created_at timestamptz not null default now(),
  primary key (class_id, user_id),
  constraint class_memberships_role_check check (member_role in ('student', 'teacher'))
);

create table if not exists public.knowledge_nodes (
  id text primary key,
  parent_id text references public.knowledge_nodes(id) on delete set null,
  level text not null,
  module text not null,
  name text not null,
  english_label text,
  definition text not null default '',
  bkt_eligible boolean not null default false,
  irt_eligible boolean not null default false,
  bloom_target text,
  thinking_primary text,
  priority text not null default 'P0' check (priority in ('P0', 'P1')),
  review_risk text not null default '低' check (review_risk in ('低', '中', '高')),
  source_metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_edges (
  id text primary key,
  source_id text not null references public.knowledge_nodes(id) on delete cascade,
  relation text not null,
  target_id text not null references public.knowledge_nodes(id) on delete cascade,
  module text not null,
  rationale text not null default '',
  created_at timestamptz not null default now(),
  constraint knowledge_edges_no_self_loop check (source_id <> target_id)
);

create table if not exists public.tasks (
  id text primary key,
  module text not null,
  title text not null,
  task_type text not null,
  student_prompt text not null,
  response_format text not null,
  primary_node_ids text[] not null default '{}',
  secondary_node_ids text[] not null default '{}',
  bloom text not null,
  thinking_primary text not null,
  difficulty text not null,
  estimated_minutes integer not null check (estimated_minutes > 0),
  answer_key_or_rubric jsonb not null default '{}',
  student_safe_options jsonb not null default '{}',
  review_risk text not null default '低' check (review_risk in ('低', '中', '高')),
  copyright_status text not null default 'mock',
  status text not null default 'APPROVED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_annotations (
  id text primary key,
  task_id text not null references public.tasks(id) on delete cascade,
  knowledge_node_ids text[] not null default '{}',
  bloom_requirement text not null,
  thinking_requirement text not null,
  evidence_locations text[] not null default '{}',
  confidence numeric(4,3) not null check (confidence >= 0 and confidence <= 1),
  lint_status text not null check (lint_status in ('INFO', 'AUTO_FIX', 'WARN', 'REVIEW', 'BLOCK')),
  status text not null check (status in ('AUTO_ANNOTATING', 'QC_ROUTING', 'REVIEW_REQUIRED', 'APPROVED', 'BLOCKED')),
  created_at timestamptz not null default now()
);

create table if not exists public.learner_profiles (
  learner_id text primary key references public.students(id) on delete cascade,
  class_id text not null references public.classes(id) on delete restrict,
  active_path_id text,
  safe_summary jsonb not null default '{}',
  last_updated_at timestamptz not null default now()
);

create table if not exists public.bkt_states (
  learner_id text not null references public.students(id) on delete cascade,
  node_id text not null references public.knowledge_nodes(id) on delete cascade,
  mastery_probability numeric(5,4) not null check (mastery_probability >= 0 and mastery_probability <= 1),
  evidence_count integer not null default 0 check (evidence_count >= 0),
  confidence text not null check (confidence in ('LOW', 'MEDIUM', 'HIGH')),
  stability_label text not null check (stability_label in ('INITIAL', 'TENTATIVE', 'UPDATED', 'LOW_CONFIDENCE')),
  parameter_version text not null,
  updated_at timestamptz not null default now(),
  primary key (learner_id, node_id)
);

create table if not exists public.irt_states (
  learner_id text primary key references public.students(id) on delete cascade,
  theta numeric(8,4) not null,
  standard_error numeric(8,4) not null check (standard_error > 0),
  calibration_status text not null check (calibration_status in ('EXPERT_PRIOR', 'PILOT_TENTATIVE', 'LOW_RISK_USE', 'STABLE_TARGET')),
  parameter_version text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.bloom_profiles (
  learner_id text not null references public.students(id) on delete cascade,
  node_id text not null references public.knowledge_nodes(id) on delete cascade,
  remember text not null,
  understand text not null,
  apply text not null,
  analyze text not null,
  evaluate text not null,
  create_level text not null,
  updated_at timestamptz not null default now(),
  primary key (learner_id, node_id)
);

create table if not exists public.thinking_profiles (
  learner_id text primary key references public.students(id) on delete cascade,
  observation_discrimination text not null,
  induction_inference text not null,
  critique_creation text not null,
  evidence_coverage numeric(5,4) not null check (evidence_coverage >= 0 and evidence_coverage <= 1),
  rubric_version text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_paths (
  id text primary key,
  learner_id text not null references public.students(id) on delete cascade,
  source_path_id text,
  status text not null check (status in ('DRAFT', 'TEACHER_REVIEW', 'PUBLISHED', 'WITHDRAWN', 'ARCHIVED')),
  goal text not null,
  version integer not null check (version > 0),
  verifier_result jsonb not null default '{}',
  teacher_audit_explanation jsonb not null default '{}',
  decision_trace_ids text[] not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_paths_published_pass_check check (
    status <> 'PUBLISHED'
    or coalesce(verifier_result->>'status', '') = 'PASS'
  )
);

alter table public.learner_profiles
  add constraint learner_profiles_active_path_fk
  foreign key (active_path_id) references public.learning_paths(id) on delete set null;

create table if not exists public.path_steps (
  id uuid primary key default extensions.gen_random_uuid(),
  path_id text not null references public.learning_paths(id) on delete cascade,
  step_no integer not null check (step_no > 0),
  task_id text not null references public.tasks(id) on delete restrict,
  target_node_ids text[] not null default '{}',
  minutes integer not null check (minutes > 0),
  rationale text not null default '',
  status public.path_step_status not null default 'LOCKED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (path_id, step_no),
  unique (path_id, task_id)
);

create table if not exists public.student_submissions (
  id uuid primary key default extensions.gen_random_uuid(),
  learner_id text not null references public.students(id) on delete cascade,
  task_id text not null references public.tasks(id) on delete restrict,
  path_id text not null references public.learning_paths(id) on delete restrict,
  path_version integer not null check (path_version > 0),
  status public.submission_status not null,
  response_payload_ref text not null,
  response_payload jsonb not null default '{}',
  evidence_ids text[] not null default '{}',
  idempotency_key text not null unique,
  safe_feedback jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_submissions_path_version_lookup unique (learner_id, task_id, path_id, path_version, idempotency_key)
);

create table if not exists public.media_uploads (
  id uuid primary key default extensions.gen_random_uuid(),
  submission_id uuid references public.student_submissions(id) on delete set null,
  learner_id text not null references public.students(id) on delete cascade,
  media_type text not null check (media_type in ('audio', 'video', 'image')),
  bucket text not null,
  object_path text not null,
  status public.media_upload_status not null,
  duration_seconds integer check (duration_seconds is null or duration_seconds <= 120),
  resume_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.review_cases (
  id uuid primary key default extensions.gen_random_uuid(),
  object_type text not null check (object_type in ('ContentVersion', 'TaskAnnotation', 'LearningPath', 'StudentSubmission', 'MediaUpload', 'LmsSync')),
  object_id text not null,
  severity text not null check (severity in ('REVIEW', 'BLOCK')),
  risk_level text not null check (risk_level in ('LOW', 'MEDIUM', 'HIGH')),
  owner_user_id uuid references public.user_profiles(id) on delete set null,
  deadline_at timestamptz,
  status public.review_case_status not null default 'OPEN',
  reason_codes text[] not null default '{}',
  decision text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decision_traces (
  id text primary key,
  actor_user_id uuid references public.user_profiles(id) on delete set null,
  action text not null check (action in ('APPROVE', 'MODIFY', 'OVERRIDE', 'REJECT', 'CANCEL', 'REPLAN', 'SYSTEM_EVENT')),
  reason_required boolean not null default false,
  reason_text text,
  before_snapshot_ref text not null,
  after_snapshot_ref text,
  rule_version text,
  lint_version text,
  verifier_version text,
  created_at timestamptz not null default now(),
  constraint decision_trace_reason_check check (
    action <> 'OVERRIDE'
    and reason_required = false
    or reason_text is not null
  )
);

create table if not exists public.lms_sync_statuses (
  id uuid primary key default extensions.gen_random_uuid(),
  object_type text not null check (object_type in ('LearningPath', 'StudentSubmission', 'ClassSummary')),
  object_id text not null,
  external_id text,
  status text not null check (status in ('PENDING', 'SYNCING', 'SYNCED', 'FAILED', 'DEAD_LETTER')),
  retry_count integer not null default 0 check (retry_count >= 0),
  last_error text,
  last_attempt_at timestamptz,
  next_retry_at timestamptz,
  trace_id text,
  review_case_id uuid references public.review_cases(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rag_documents (
  id uuid primary key default extensions.gen_random_uuid(),
  source_type text not null check (source_type in ('textbook', 'question_bank', 'knowledge_graph', 'teacher_rules')),
  title text not null,
  storage_bucket text not null default 'rag-source-docs',
  storage_object_path text,
  source_version text not null default 'v1',
  copyright_status text not null default 'project-controlled',
  metadata jsonb not null default '{}',
  status text not null default 'REGISTERED',
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.rag_chunks (
  id uuid primary key default extensions.gen_random_uuid(),
  document_id uuid not null references public.rag_documents(id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  source_ref text not null,
  text text not null,
  token_count integer,
  embedding extensions.vector(1024),
  citation jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create table if not exists public.agent_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid references public.user_profiles(id) on delete set null,
  workflow_type text not null,
  model_id text not null,
  prompt_version text,
  retrieved_chunk_ids uuid[] not null default '{}',
  input_ref text not null,
  output_ref text,
  guardrail_result jsonb not null default '{}',
  token_usage jsonb not null default '{}',
  latency_ms integer,
  status text not null check (status in ('QUEUED', 'RUNNING', 'SUCCEEDED', 'COMPLETED', 'FAILED', 'BLOCKED')),
  trace_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tool_calls (
  id uuid primary key default extensions.gen_random_uuid(),
  agent_run_id uuid not null references public.agent_runs(id) on delete cascade,
  tool_name text not null,
  tool_type text not null default 'internal',
  input_ref text not null,
  output_ref text,
  safety_status text not null default 'pass',
  citation_ids uuid[] not null default '{}',
  status text not null check (status in ('QUEUED', 'RUNNING', 'SUCCEEDED', 'COMPLETED', 'FAILED', 'BLOCKED')),
  latency_ms integer,
  created_at timestamptz not null default now()
);

create table if not exists public.queue_jobs (
  id uuid primary key default extensions.gen_random_uuid(),
  job_type text not null,
  payload_ref text not null,
  status text not null check (status in ('QUEUED', 'RUNNING', 'SUCCEEDED', 'RETRY_WAITING', 'FAILED', 'DEAD_LETTER', 'CANCELLED', 'COMPENSATED')),
  retry_count integer not null default 0 check (retry_count >= 0),
  next_retry_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_user_id uuid,
  role public.user_role,
  organization_id text,
  class_id text,
  action text not null,
  object_type text not null,
  object_id text not null,
  before_snapshot_ref text,
  after_snapshot_ref text,
  request_id text,
  trace_id text,
  ip_hash text,
  user_agent text,
  job_id uuid,
  initiated_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  role public.user_role not null,
  organization_id text not null references public.organizations(id) on delete restrict,
  class_id text references public.classes(id) on delete cascade,
  scope jsonb not null default '{}',
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED', 'REVOKED')),
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, role, organization_id, class_id)
);

create table if not exists public.admin_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  active_role_assignment_id uuid references public.role_assignments(id) on delete set null,
  active_scope jsonb not null default '{}',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.taxonomy_versions (
  id text primary key,
  status text not null check (status in ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED')),
  version integer not null check (version > 0),
  compatibility_mappings jsonb not null default '{}',
  created_by uuid references public.user_profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.taxonomy_change_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  taxonomy_version_id text not null references public.taxonomy_versions(id) on delete cascade,
  requested_by uuid references public.user_profiles(id) on delete set null,
  change_payload jsonb not null default '{}',
  status text not null default 'OPEN' check (status in ('OPEN', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'BLOCKED')),
  review_case_id uuid references public.review_cases(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.content_versions (
  id text primary key,
  unit_id text not null,
  status text not null check (status in ('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'BLOCKED', 'ARCHIVED')),
  version integer not null check (version > 0),
  source_ref text not null,
  copyright_status text not null default 'mock',
  created_by uuid references public.user_profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.content_drafts (
  id uuid primary key default extensions.gen_random_uuid(),
  content_version_id text references public.content_versions(id) on delete cascade,
  owner_user_id uuid references public.user_profiles(id) on delete set null,
  draft_payload jsonb not null default '{}',
  status text not null default 'DRAFT' check (status in ('DRAFT', 'SUBMITTED', 'DISCARDED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.unit_packages (
  id text primary key,
  content_version_id text references public.content_versions(id) on delete restrict,
  status text not null check (status in ('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'BLOCKED', 'ARCHIVED')),
  version integer not null check (version > 0),
  task_ids text[] not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.annotation_jobs (
  id uuid primary key default extensions.gen_random_uuid(),
  task_id text references public.tasks(id) on delete cascade,
  content_version_id text references public.content_versions(id) on delete cascade,
  status text not null default 'QUEUED' check (status in ('QUEUED', 'RUNNING', 'SUCCEEDED', 'RETRY_WAITING', 'FAILED', 'DEAD_LETTER', 'CANCELLED', 'COMPENSATED')),
  lint_status text not null default 'INFO' check (lint_status in ('INFO', 'AUTO_FIX', 'WARN', 'REVIEW', 'BLOCK')),
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rule_profiles (
  id text primary key,
  version integer not null check (version > 0),
  status text not null check (status in ('DRAFT', 'REVIEW', 'RELEASED', 'ROLLED_BACK', 'ARCHIVED')),
  rule_config jsonb not null default '{}',
  released_by uuid references public.user_profiles(id) on delete set null,
  released_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_constraints (
  id uuid primary key default extensions.gen_random_uuid(),
  teacher_user_id uuid not null references public.user_profiles(id) on delete cascade,
  class_id text references public.classes(id) on delete cascade,
  learner_id text references public.students(id) on delete cascade,
  constraints jsonb not null default '{}',
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUPERSEDED', 'REVOKED')),
  created_at timestamptz not null default now()
);

create table if not exists public.evidence_sources (
  id uuid primary key default extensions.gen_random_uuid(),
  source_type text not null,
  title text not null,
  citation_ref text not null,
  metadata jsonb not null default '{}',
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.research_claims (
  id uuid primary key default extensions.gen_random_uuid(),
  claim_text text not null,
  evidence_source_id uuid references public.evidence_sources(id) on delete set null,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'REVIEW', 'APPROVED', 'REJECTED', 'BLOCKED')),
  owner_user_id uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.research_review_cases (
  id uuid primary key default extensions.gen_random_uuid(),
  research_claim_id uuid not null references public.research_claims(id) on delete cascade,
  review_case_id uuid references public.review_cases(id) on delete set null,
  expert_user_id uuid references public.user_profiles(id) on delete set null,
  status text not null default 'OPEN' check (status in ('OPEN', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'BLOCKED', 'RESOLVED')),
  created_at timestamptz not null default now()
);

create table if not exists public.lms_dead_letters (
  id uuid primary key default extensions.gen_random_uuid(),
  sync_status_id uuid references public.lms_sync_statuses(id) on delete set null,
  payload_ref text not null,
  error_code text,
  last_error text not null,
  status text not null default 'DEAD_LETTER' check (status in ('DEAD_LETTER', 'COMPENSATED', 'CANCELLED')),
  review_case_id uuid references public.review_cases(id) on delete set null,
  compensated_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.schema_versions (
  id text primary key,
  checksum text not null,
  status text not null check (status in ('PLANNED', 'APPLIED', 'FAILED', 'ROLLED_BACK')),
  applied_by uuid references public.user_profiles(id) on delete set null,
  applied_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.generated_crud_specs (
  id uuid primary key default extensions.gen_random_uuid(),
  object_name text not null,
  version integer not null check (version > 0),
  owner_surface text not null check (owner_surface in ('admin-web', 'foundation-console', 'api')),
  spec jsonb not null default '{}',
  review_status text not null default 'DRAFT' check (review_status in ('DRAFT', 'NEEDS_REVIEW', 'APPROVED', 'REJECTED')),
  generated_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (object_name, version, owner_surface)
);

create table if not exists public.environment_checks (
  id uuid primary key default extensions.gen_random_uuid(),
  check_name text not null,
  status text not null check (status in ('PASS', 'WARN', 'FAIL', 'SKIPPED')),
  details jsonb not null default '{}',
  checked_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_by uuid references public.user_profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.trace_events (
  id uuid primary key default extensions.gen_random_uuid(),
  trace_id text not null,
  event_type text not null,
  object_ref text,
  payload_ref text,
  created_at timestamptz not null default now()
);

create table if not exists public.tool_registry (
  id text primary key,
  tool_name text not null,
  tool_type text not null,
  version integer not null check (version > 0),
  owner text not null,
  allowed_roles public.user_role[] not null default '{}',
  allowed_workflows text[] not null default '{}',
  input_schema jsonb not null default '{}',
  output_schema jsonb not null default '{}',
  secrets_required text[] not null default '{}',
  audit_level text not null check (audit_level in ('metadata', 'payload_ref', 'full_snapshot_ref')),
  timeout_ms integer not null default 30000 check (timeout_ms > 0),
  retry_policy jsonb not null default '{}',
  student_visible boolean not null default false,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists classes_organization_id_idx on public.classes(organization_id);
create index if not exists user_profiles_organization_id_idx on public.user_profiles(organization_id);
create index if not exists students_class_id_idx on public.students(class_id);
create index if not exists students_user_id_idx on public.students(user_id);
create index if not exists class_memberships_user_id_idx on public.class_memberships(user_id);
create index if not exists knowledge_edges_source_id_idx on public.knowledge_edges(source_id);
create index if not exists knowledge_edges_target_id_idx on public.knowledge_edges(target_id);
create index if not exists tasks_primary_node_ids_gin_idx on public.tasks using gin(primary_node_ids);
create index if not exists task_annotations_task_id_idx on public.task_annotations(task_id);
create index if not exists learner_profiles_class_id_idx on public.learner_profiles(class_id);
create index if not exists bkt_states_node_id_idx on public.bkt_states(node_id);
create index if not exists bloom_profiles_node_id_idx on public.bloom_profiles(node_id);
create index if not exists learning_paths_learner_status_idx on public.learning_paths(learner_id, status);
create index if not exists path_steps_task_id_idx on public.path_steps(task_id);
create index if not exists student_submissions_lookup_idx on public.student_submissions(learner_id, task_id, path_id, path_version);
create index if not exists media_uploads_submission_id_idx on public.media_uploads(submission_id);
create index if not exists media_uploads_learner_id_idx on public.media_uploads(learner_id);
create index if not exists review_cases_status_severity_owner_idx on public.review_cases(status, severity, owner_user_id);
create index if not exists lms_sync_statuses_status_retry_idx on public.lms_sync_statuses(status, next_retry_at);
create index if not exists rag_documents_source_type_idx on public.rag_documents(source_type);
create index if not exists rag_chunks_document_id_idx on public.rag_chunks(document_id);
create index if not exists agent_runs_user_workflow_created_idx on public.agent_runs(user_id, workflow_type, created_at desc);
create index if not exists tool_calls_run_tool_created_idx on public.tool_calls(agent_run_id, tool_name, created_at desc);
create index if not exists queue_jobs_status_retry_idx on public.queue_jobs(status, next_retry_at);
create index if not exists audit_logs_actor_created_idx on public.audit_logs(actor_user_id, created_at desc);
create index if not exists role_assignments_user_id_idx on public.role_assignments(user_id);
create index if not exists role_assignments_org_class_idx on public.role_assignments(organization_id, class_id);
create index if not exists admin_sessions_user_id_idx on public.admin_sessions(user_id);
create index if not exists admin_sessions_active_role_idx on public.admin_sessions(active_role_assignment_id);
create index if not exists taxonomy_change_requests_version_idx on public.taxonomy_change_requests(taxonomy_version_id);
create index if not exists content_versions_created_by_idx on public.content_versions(created_by);
create index if not exists content_drafts_content_version_idx on public.content_drafts(content_version_id);
create index if not exists content_drafts_owner_idx on public.content_drafts(owner_user_id);
create index if not exists unit_packages_content_version_idx on public.unit_packages(content_version_id);
create index if not exists annotation_jobs_task_id_idx on public.annotation_jobs(task_id);
create index if not exists annotation_jobs_content_version_idx on public.annotation_jobs(content_version_id);
create index if not exists annotation_jobs_agent_run_idx on public.annotation_jobs(agent_run_id);
create index if not exists teacher_constraints_teacher_idx on public.teacher_constraints(teacher_user_id);
create index if not exists teacher_constraints_class_idx on public.teacher_constraints(class_id);
create index if not exists teacher_constraints_learner_idx on public.teacher_constraints(learner_id);
create index if not exists evidence_sources_created_by_idx on public.evidence_sources(created_by);
create index if not exists research_claims_evidence_source_idx on public.research_claims(evidence_source_id);
create index if not exists research_claims_owner_idx on public.research_claims(owner_user_id);
create index if not exists research_review_cases_claim_idx on public.research_review_cases(research_claim_id);
create index if not exists research_review_cases_review_case_idx on public.research_review_cases(review_case_id);
create index if not exists lms_dead_letters_sync_status_idx on public.lms_dead_letters(sync_status_id);
create index if not exists lms_dead_letters_status_idx on public.lms_dead_letters(status, created_at desc);
create index if not exists schema_versions_status_idx on public.schema_versions(status, created_at desc);
create index if not exists generated_crud_specs_owner_status_idx on public.generated_crud_specs(owner_surface, review_status);
create index if not exists environment_checks_name_created_idx on public.environment_checks(check_name, created_at desc);
create index if not exists trace_events_trace_id_idx on public.trace_events(trace_id, created_at desc);
create index if not exists tool_registry_enabled_idx on public.tool_registry(enabled, owner);

-- HNSW is suitable once vectors exist. For very small datasets this is still harmless.
create index if not exists rag_chunks_embedding_hnsw_idx
  on public.rag_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

create or replace function public.current_app_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_profiles where id = auth.uid()
$$;

create or replace function public.current_student_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id from public.students where user_id = auth.uid()
$$;

create or replace function public.is_assigned_to_class(target_class_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_memberships cm
    where cm.class_id = target_class_id
      and cm.user_id = auth.uid()
  )
$$;

create or replace function public.is_staff_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() in ('teacher', 'curriculum_researcher', 'expert', 'admin'), false)
$$;

alter table public.organizations enable row level security;
alter table public.classes enable row level security;
alter table public.user_profiles enable row level security;
alter table public.students enable row level security;
alter table public.class_memberships enable row level security;
alter table public.knowledge_nodes enable row level security;
alter table public.knowledge_edges enable row level security;
alter table public.tasks enable row level security;
alter table public.task_annotations enable row level security;
alter table public.learner_profiles enable row level security;
alter table public.bkt_states enable row level security;
alter table public.irt_states enable row level security;
alter table public.bloom_profiles enable row level security;
alter table public.thinking_profiles enable row level security;
alter table public.learning_paths enable row level security;
alter table public.path_steps enable row level security;
alter table public.student_submissions enable row level security;
alter table public.media_uploads enable row level security;
alter table public.review_cases enable row level security;
alter table public.decision_traces enable row level security;
alter table public.lms_sync_statuses enable row level security;
alter table public.rag_documents enable row level security;
alter table public.rag_chunks enable row level security;
alter table public.agent_runs enable row level security;
alter table public.tool_calls enable row level security;
alter table public.queue_jobs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.role_assignments enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.taxonomy_versions enable row level security;
alter table public.taxonomy_change_requests enable row level security;
alter table public.content_versions enable row level security;
alter table public.content_drafts enable row level security;
alter table public.unit_packages enable row level security;
alter table public.annotation_jobs enable row level security;
alter table public.rule_profiles enable row level security;
alter table public.teacher_constraints enable row level security;
alter table public.evidence_sources enable row level security;
alter table public.research_claims enable row level security;
alter table public.research_review_cases enable row level security;
alter table public.lms_dead_letters enable row level security;
alter table public.schema_versions enable row level security;
alter table public.generated_crud_specs enable row level security;
alter table public.environment_checks enable row level security;
alter table public.system_settings enable row level security;
alter table public.trace_events enable row level security;
alter table public.tool_registry enable row level security;

create policy "users read own profile" on public.user_profiles
for select to authenticated
using (id = auth.uid());

create policy "students read own student row" on public.students
for select to authenticated
using (user_id = auth.uid());

create policy "staff read assigned students" on public.students
for select to authenticated
using (public.is_staff_role() and public.is_assigned_to_class(class_id));

create policy "users read own class memberships" on public.class_memberships
for select to authenticated
using (user_id = auth.uid() or public.current_app_role() = 'admin');

create policy "users read assigned classes" on public.classes
for select to authenticated
using (public.is_assigned_to_class(id) or public.current_app_role() = 'admin');

create policy "students read own learner profile" on public.learner_profiles
for select to authenticated
using (learner_id = public.current_student_id());

create policy "staff read scoped bkt states" on public.bkt_states
for select to authenticated
using (
  public.is_staff_role()
  and (
    public.current_app_role() = 'admin'
    or exists (
    select 1 from public.students s
    where s.id = bkt_states.learner_id
      and public.is_assigned_to_class(s.class_id)
    )
  )
);

create policy "staff read scoped irt states" on public.irt_states
for select to authenticated
using (
  public.is_staff_role()
  and (
    public.current_app_role() = 'admin'
    or exists (
    select 1 from public.students s
    where s.id = irt_states.learner_id
      and public.is_assigned_to_class(s.class_id)
    )
  )
);

create policy "staff read scoped bloom profiles" on public.bloom_profiles
for select to authenticated
using (
  public.is_staff_role()
  and (
    public.current_app_role() = 'admin'
    or exists (
    select 1 from public.students s
    where s.id = bloom_profiles.learner_id
      and public.is_assigned_to_class(s.class_id)
    )
  )
);

create policy "staff read scoped thinking profiles" on public.thinking_profiles
for select to authenticated
using (
  public.is_staff_role()
  and (
    public.current_app_role() = 'admin'
    or exists (
    select 1 from public.students s
    where s.id = thinking_profiles.learner_id
      and public.is_assigned_to_class(s.class_id)
    )
  )
);

create policy "staff read scoped learning paths" on public.learning_paths
for select to authenticated
using (
  public.is_staff_role()
  and (
    public.current_app_role() = 'admin'
    or exists (
    select 1 from public.students s
    where s.id = learning_paths.learner_id
      and public.is_assigned_to_class(s.class_id)
    )
  )
);

create policy "staff read scoped path steps" on public.path_steps
for select to authenticated
using (
  public.is_staff_role()
  and (
    public.current_app_role() = 'admin'
    or exists (
    select 1
    from public.learning_paths lp
    join public.students s on s.id = lp.learner_id
    where lp.id = path_steps.path_id
      and public.is_assigned_to_class(s.class_id)
    )
  )
);

create policy "students insert own submissions" on public.student_submissions
for insert to authenticated
with check (learner_id = public.current_student_id());

create policy "students read own submissions" on public.student_submissions
for select to authenticated
using (learner_id = public.current_student_id());

create policy "students insert own media metadata" on public.media_uploads
for insert to authenticated
with check (learner_id = public.current_student_id());

create policy "students read own media metadata" on public.media_uploads
for select to authenticated
using (learner_id = public.current_student_id());

create policy "staff read class learner profiles" on public.learner_profiles
for select to authenticated
using (public.is_staff_role() and public.is_assigned_to_class(class_id));

create policy "content staff read knowledge nodes" on public.knowledge_nodes
for select to authenticated
using (public.current_app_role() in ('teacher', 'curriculum_researcher', 'expert', 'admin'));

create policy "content staff read knowledge edges" on public.knowledge_edges
for select to authenticated
using (public.current_app_role() in ('teacher', 'curriculum_researcher', 'expert', 'admin'));

create policy "content staff manage knowledge nodes" on public.knowledge_nodes
for all to authenticated
using (public.current_app_role() in ('curriculum_researcher', 'admin'))
with check (public.current_app_role() in ('curriculum_researcher', 'admin'));

create policy "content staff manage knowledge edges" on public.knowledge_edges
for all to authenticated
using (public.current_app_role() in ('curriculum_researcher', 'admin'))
with check (public.current_app_role() in ('curriculum_researcher', 'admin'));

create policy "staff read tasks" on public.tasks
for select to authenticated
using (public.current_app_role() in ('teacher', 'curriculum_researcher', 'expert', 'admin'));

create policy "content staff manage tasks" on public.tasks
for all to authenticated
using (public.current_app_role() in ('curriculum_researcher', 'admin'))
with check (public.current_app_role() in ('curriculum_researcher', 'admin'));

create policy "staff read task annotations" on public.task_annotations
for select to authenticated
using (public.current_app_role() in ('teacher', 'curriculum_researcher', 'expert', 'admin'));

create policy "content staff manage task annotations" on public.task_annotations
for all to authenticated
using (public.current_app_role() in ('curriculum_researcher', 'expert', 'admin'))
with check (public.current_app_role() in ('curriculum_researcher', 'expert', 'admin'));

create policy "staff read scoped review cases" on public.review_cases
for select to authenticated
using (public.current_app_role() in ('teacher', 'curriculum_researcher', 'expert', 'admin'));

create policy "staff update scoped review cases" on public.review_cases
for update to authenticated
using (public.current_app_role() in ('teacher', 'curriculum_researcher', 'expert', 'admin'))
with check (public.current_app_role() in ('teacher', 'curriculum_researcher', 'expert', 'admin'));

create policy "staff read decision traces" on public.decision_traces
for select to authenticated
using (public.current_app_role() in ('teacher', 'curriculum_researcher', 'expert', 'admin'));

create policy "staff read lms sync" on public.lms_sync_statuses
for select to authenticated
using (public.current_app_role() in ('teacher', 'admin'));

create policy "research staff manage rag docs" on public.rag_documents
for all to authenticated
using (public.current_app_role() in ('curriculum_researcher', 'admin'))
with check (public.current_app_role() in ('curriculum_researcher', 'admin'));

create policy "research staff manage rag chunks" on public.rag_chunks
for all to authenticated
using (public.current_app_role() in ('curriculum_researcher', 'admin'))
with check (public.current_app_role() in ('curriculum_researcher', 'admin'));

create policy "staff read agent runs" on public.agent_runs
for select to authenticated
using (public.current_app_role() in ('teacher', 'curriculum_researcher', 'expert', 'admin'));

create policy "staff read tool calls" on public.tool_calls
for select to authenticated
using (public.current_app_role() in ('teacher', 'curriculum_researcher', 'expert', 'admin'));

create policy "admin read queue jobs" on public.queue_jobs
for select to authenticated
using (public.current_app_role() = 'admin');

create policy "admin read audit logs" on public.audit_logs
for select to authenticated
using (public.current_app_role() = 'admin');

create policy "admin manage role assignments" on public.role_assignments
for all to authenticated
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

create policy "users read own admin sessions" on public.admin_sessions
for select to authenticated
using (user_id = auth.uid() or public.current_app_role() = 'admin');

create policy "content staff read taxonomy versions" on public.taxonomy_versions
for select to authenticated
using (public.current_app_role() in ('teacher', 'curriculum_researcher', 'expert', 'admin'));

create policy "research staff manage taxonomy versions" on public.taxonomy_versions
for all to authenticated
using (public.current_app_role() in ('curriculum_researcher', 'expert', 'admin'))
with check (public.current_app_role() in ('curriculum_researcher', 'expert', 'admin'));

create policy "research staff manage taxonomy change requests" on public.taxonomy_change_requests
for all to authenticated
using (public.current_app_role() in ('curriculum_researcher', 'expert', 'admin'))
with check (public.current_app_role() in ('curriculum_researcher', 'expert', 'admin'));

create policy "content staff manage content versions" on public.content_versions
for all to authenticated
using (public.current_app_role() in ('curriculum_researcher', 'admin'))
with check (public.current_app_role() in ('curriculum_researcher', 'admin'));

create policy "content staff manage content drafts" on public.content_drafts
for all to authenticated
using (public.current_app_role() in ('curriculum_researcher', 'admin'))
with check (public.current_app_role() in ('curriculum_researcher', 'admin'));

create policy "content staff manage unit packages" on public.unit_packages
for all to authenticated
using (public.current_app_role() in ('curriculum_researcher', 'admin'))
with check (public.current_app_role() in ('curriculum_researcher', 'admin'));

create policy "content staff read annotation jobs" on public.annotation_jobs
for select to authenticated
using (public.current_app_role() in ('curriculum_researcher', 'expert', 'admin'));

create policy "admin manage rule profiles" on public.rule_profiles
for all to authenticated
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

create policy "teachers manage own constraints" on public.teacher_constraints
for all to authenticated
using (teacher_user_id = auth.uid() or public.current_app_role() = 'admin')
with check (teacher_user_id = auth.uid() or public.current_app_role() = 'admin');

create policy "research staff manage evidence sources" on public.evidence_sources
for all to authenticated
using (public.current_app_role() in ('curriculum_researcher', 'expert', 'admin'))
with check (public.current_app_role() in ('curriculum_researcher', 'expert', 'admin'));

create policy "research staff manage research claims" on public.research_claims
for all to authenticated
using (public.current_app_role() in ('curriculum_researcher', 'expert', 'admin'))
with check (public.current_app_role() in ('curriculum_researcher', 'expert', 'admin'));

create policy "research staff manage research review cases" on public.research_review_cases
for all to authenticated
using (public.current_app_role() in ('curriculum_researcher', 'expert', 'admin'))
with check (public.current_app_role() in ('curriculum_researcher', 'expert', 'admin'));

create policy "admin read lms dead letters" on public.lms_dead_letters
for select to authenticated
using (public.current_app_role() = 'admin');

create policy "admin manage foundation metadata" on public.schema_versions
for all to authenticated
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

create policy "admin manage generated crud specs" on public.generated_crud_specs
for all to authenticated
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

create policy "admin read environment checks" on public.environment_checks
for select to authenticated
using (public.current_app_role() = 'admin');

create policy "admin manage system settings" on public.system_settings
for all to authenticated
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

create policy "admin read trace events" on public.trace_events
for select to authenticated
using (public.current_app_role() = 'admin');

create policy "admin manage tool registry" on public.tool_registry
for all to authenticated
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

-- Backend service role writes operational rows through trusted FastAPI/worker jobs.
create policy "service manages submissions" on public.student_submissions for all to service_role using (true) with check (true);
create policy "service manages media uploads" on public.media_uploads for all to service_role using (true) with check (true);
create policy "service manages paths" on public.learning_paths for all to service_role using (true) with check (true);
create policy "service manages path steps" on public.path_steps for all to service_role using (true) with check (true);
create policy "service manages agent runs" on public.agent_runs for all to service_role using (true) with check (true);
create policy "service manages tool calls" on public.tool_calls for all to service_role using (true) with check (true);
create policy "service manages queue jobs" on public.queue_jobs for all to service_role using (true) with check (true);
create policy "service manages audit logs" on public.audit_logs for all to service_role using (true) with check (true);
create policy "service manages lms sync" on public.lms_sync_statuses for all to service_role using (true) with check (true);
create policy "service manages review cases" on public.review_cases for all to service_role using (true) with check (true);
create policy "service manages decision traces" on public.decision_traces for all to service_role using (true) with check (true);
create policy "service manages trace events" on public.trace_events for all to service_role using (true) with check (true);
create policy "service manages lms dead letters" on public.lms_dead_letters for all to service_role using (true) with check (true);

create or replace view public.student_home_view
with (security_barrier = true)
as
select
  s.id as learner_id,
  s.pseudonymous_label as student_display_label,
  c.display_name as class_display_name,
  lp.id as path_id,
  lp.version as path_version,
  lp.goal as path_goal,
  lp.status as path_status,
  count(ps.id)::integer as total_count,
  count(ps.id) filter (where ps.status = 'COMPLETED')::integer as completed_count,
  coalesce(sum(ps.minutes), 0)::integer as total_minutes,
  (
    select jsonb_build_object(
      'task_id', t.id,
      'step_no', ps2.step_no,
      'title', t.title,
      'task_type', t.task_type,
      'minutes', ps2.minutes,
      'status', ps2.status
    )
    from public.path_steps ps2
    join public.tasks t on t.id = ps2.task_id
    where ps2.path_id = lp.id
      and ps2.status in ('IN_PROGRESS', 'AVAILABLE')
    order by ps2.step_no
    limit 1
  ) as next_task_summary,
  'ready'::text as safe_status,
  'ready'::text as safe_sync_status
from public.students s
join public.classes c on c.id = s.class_id
join public.learner_profiles lpr on lpr.learner_id = s.id
join public.learning_paths lp on lp.id = lpr.active_path_id and lp.learner_id = s.id
join public.path_steps ps on ps.path_id = lp.id
where s.user_id = auth.uid()
  and lp.status = 'PUBLISHED'
  and coalesce(lp.verifier_result->>'status', '') = 'PASS'
  and not exists (
    select 1
    from public.review_cases rc
    where rc.object_type = 'LearningPath'
      and rc.object_id = lp.id
      and rc.severity = 'BLOCK'
      and rc.status not in ('APPROVED', 'CONDITIONALLY_APPROVED', 'RESOLVED')
  )
group by s.id, s.pseudonymous_label, c.display_name, lp.id, lp.version, lp.goal, lp.status;

create or replace view public.student_learning_path_view
with (security_barrier = true)
as
select
  s.id as learner_id,
  lp.id as path_id,
  lp.version as path_version,
  lp.goal,
  lp.status as path_status,
  ps.step_no,
  ps.task_id,
  t.title as task_title,
  t.task_type,
  ps.minutes,
  ps.status as step_status,
  t.bloom,
  t.thinking_primary as thinking,
  t.primary_node_ids,
  coalesce(lp.teacher_audit_explanation->>'student_text', ps.rationale) as student_text,
  'ready'::text as safe_status
from public.students s
join public.learner_profiles lpr on lpr.learner_id = s.id
join public.learning_paths lp on lp.id = lpr.active_path_id and lp.learner_id = s.id
join public.path_steps ps on ps.path_id = lp.id
join public.tasks t on t.id = ps.task_id
where s.user_id = auth.uid()
  and lp.status = 'PUBLISHED'
  and coalesce(lp.verifier_result->>'status', '') = 'PASS';

create or replace view public.student_task_view
with (security_barrier = true)
as
select
  s.id as learner_id,
  lp.id as path_id,
  lp.version as path_version,
  ps.step_no,
  ps.status as step_status,
  t.id as task_id,
  t.module,
  t.title,
  t.task_type,
  t.student_prompt,
  t.response_format,
  t.primary_node_ids,
  t.bloom,
  t.thinking_primary as thinking,
  t.difficulty,
  t.estimated_minutes,
  t.student_safe_options,
  t.review_risk,
  coalesce(lp.teacher_audit_explanation->>'student_text', ps.rationale) as student_text,
  case when ps.status = 'REVIEW_PENDING' then 'review_pending' else 'ready' end as safe_status
from public.students s
join public.learner_profiles lpr on lpr.learner_id = s.id
join public.learning_paths lp on lp.id = lpr.active_path_id and lp.learner_id = s.id
join public.path_steps ps on ps.path_id = lp.id
join public.tasks t on t.id = ps.task_id
where s.user_id = auth.uid()
  and lp.status = 'PUBLISHED'
  and coalesce(lp.verifier_result->>'status', '') = 'PASS'
  and ps.status in ('AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'REVIEW_PENDING');

create or replace view public.student_feedback_view
with (security_barrier = true)
as
select
  ss.learner_id,
  ss.id as submission_id,
  ss.task_id,
  ss.path_id,
  ss.path_version,
  ss.status as submission_status,
  ss.safe_feedback,
  case when ss.status = 'REVIEW_PENDING' then 'review_pending' else 'ready' end as safe_status,
  ss.created_at,
  ss.updated_at
from public.student_submissions ss
join public.students s on s.id = ss.learner_id
where s.user_id = auth.uid();

create or replace view public.student_profile_summary_view
with (security_barrier = true)
as
select
  s.id as learner_id,
  lp.active_path_id,
  lp.safe_summary,
  'ready'::text as safe_status,
  lp.last_updated_at
from public.learner_profiles lp
join public.students s on s.id = lp.learner_id
where s.user_id = auth.uid();

create or replace view public.student_upload_status_view
with (security_barrier = true)
as
select
  mu.learner_id,
  mu.id as media_upload_id,
  mu.submission_id,
  mu.media_type,
  mu.bucket,
  mu.object_path,
  mu.status,
  case when mu.status = 'REVIEW_PENDING' then 'review_pending' else 'ready' end as safe_status,
  mu.created_at,
  mu.updated_at
from public.media_uploads mu
join public.students s on s.id = mu.learner_id
where s.user_id = auth.uid();

grant select on
  public.student_home_view,
  public.student_learning_path_view,
  public.student_task_view,
  public.student_feedback_view,
  public.student_profile_summary_view,
  public.student_upload_status_view
to authenticated;

-- Storage buckets. If your Supabase SQL role cannot modify storage schema, create these four
-- private buckets in the dashboard with the same names and apply equivalent policies below.
insert into storage.buckets (id, name, public)
values
  ('student-media', 'student-media', false),
  ('rag-source-docs', 'rag-source-docs', false),
  ('generated-feedback', 'generated-feedback', false),
  ('prototype-exports', 'prototype-exports', false)
on conflict (id) do update set public = excluded.public;

create policy "students manage own student media folder" on storage.objects
for all to authenticated
using (
  bucket_id = 'student-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'student-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "research staff manage rag source docs" on storage.objects
for all to authenticated
using (
  bucket_id = 'rag-source-docs'
  and public.current_app_role() in ('curriculum_researcher', 'admin')
)
with check (
  bucket_id = 'rag-source-docs'
  and public.current_app_role() in ('curriculum_researcher', 'admin')
);

create policy "staff read generated feedback exports" on storage.objects
for select to authenticated
using (
  bucket_id in ('generated-feedback', 'prototype-exports')
  and public.current_app_role() in ('teacher', 'curriculum_researcher', 'expert', 'admin')
);

create policy "staff manage prototype exports" on storage.objects
for all to authenticated
using (
  bucket_id = 'prototype-exports'
  and public.current_app_role() in ('teacher', 'curriculum_researcher', 'admin')
)
with check (
  bucket_id = 'prototype-exports'
  and public.current_app_role() in ('teacher', 'curriculum_researcher', 'admin')
);
