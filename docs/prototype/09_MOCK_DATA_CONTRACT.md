# 09 Mock Data Contract

Mock data is for prototype demonstration only. It must not be described as real model output or learning-effect evidence.

## Unit 6 Dataset
| Source | Count / fields |
|---|---|
| Knowledge nodes | 128 rows with `Node_ID`, hierarchy, module, definition, BKT/IRT eligibility, Bloom/thinking targets, strategies, priority, risk |
| Edges | 669 rows with `Source_ID`, `Relation`, `Target_ID`, module, rationale |
| Tasks | 91 rows with `Task_ID`, module, task type, prompt, response format, node links, Bloom, thinking, difficulty, `IRT_b`, minutes, scoring, risk, review policy, copyright |
| Sample path rows | 36 rows across 6 `Path_ID` values with step order, task ID, target nodes, rationale, teacher action |
| Risk distribution | 55 low, 23 medium, 13 high tasks |

## Core Types
Use these shapes for fixtures. Field names can be adapted to TypeScript style later, but object boundaries must remain.

```ts
type User = {
  user_id: string;
  role: "student" | "teacher" | "curriculum_researcher" | "expert" | "admin";
  display_name: string;
  organization_id: string;
  class_ids?: string[];
};

type Organization = {
  organization_id: string;
  name: string;
  region_label: string;
};

type Class = {
  class_id: string;
  organization_id: string;
  grade: "七年级";
  subject: "English";
  teacher_user_ids: string[];
  student_ids: string[];
};

type Student = {
  student_id: string;
  class_id: string;
  pseudonymous_label: string;
  persona_id: "persona_a" | "persona_b" | "persona_c";
};

type LearnerProfile = {
  learner_id: string;
  class_id: string;
  active_path_id?: string;
  bkt_states: BKTKnowledgeState[];
  irt_state: IRTAbilityState;
  bloom_profile: BloomEvidenceProfile[];
  thinking_profile: ThinkingQualityProfile;
  last_updated_at: string;
};

type KnowledgeNode = {
  node_id: string;
  parent_id?: string;
  level: string;
  module: string;
  name: string;
  definition: string;
  bkt_eligible: boolean;
  irt_eligible: boolean;
  bloom_target?: string;
  thinking_primary?: string;
  priority: "P0" | "P1";
  review_risk: "低" | "中" | "高";
};

type BKTKnowledgeState = {
  learner_id: string;
  node_id: string;
  mastery_probability: number;
  evidence_count: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  stability_label: "INITIAL" | "TENTATIVE" | "UPDATED" | "LOW_CONFIDENCE";
  parameter_version: string;
};

type IRTAbilityState = {
  learner_id: string;
  theta: number;
  standard_error: number;
  calibration_status: "EXPERT_PRIOR" | "PILOT_TENTATIVE" | "LOW_RISK_USE" | "STABLE_TARGET";
  parameter_version: string;
};

type BloomEvidenceProfile = {
  learner_id: string;
  node_id: string;
  remember: BloomEvidenceState;
  understand: BloomEvidenceState;
  apply: BloomEvidenceState;
  analyze: BloomEvidenceState;
  evaluate: BloomEvidenceState;
  create: BloomEvidenceState;
};

type BloomEvidenceState = "NOT_ASSESSED" | "INSUFFICIENT" | "EMERGING" | "CONFIRMED";

type ThinkingQualityProfile = {
  learner_id: string;
  observation_discrimination: ThinkingLevel;
  induction_inference: ThinkingLevel;
  critique_creation: ThinkingLevel;
  evidence_coverage: number;
  rubric_version: string;
};

type ThinkingLevel = "EVIDENCE_INSUFFICIENT" | "T0" | "T1" | "T2" | "T3" | "T4";

type Task = {
  task_id: string;
  module: string;
  title: string;
  task_type: string;
  student_prompt: string;
  response_format: string;
  primary_node_ids: string[];
  secondary_node_ids: string[];
  bloom: string;
  thinking_primary: string;
  difficulty: "非常容易" | "容易" | "中等" | "困难" | "非常困难";
  irt_b: number;
  estimated_minutes: number;
  review_risk: "低" | "中" | "高";
  copyright_status: string;
};

type TaskAnnotation = {
  annotation_id: string;
  task_id: string;
  knowledge_node_ids: string[];
  bloom_requirement: string;
  thinking_requirement: string;
  evidence_locations: string[];
  confidence: number;
  lint_status: "INFO" | "AUTO_FIX" | "WARN" | "REVIEW" | "BLOCK";
  status: "AUTO_ANNOTATING" | "QC_ROUTING" | "REVIEW_REQUIRED" | "APPROVED" | "BLOCKED";
};

type LearningPath = {
  path_id: string;
  learner_id: string;
  status: string;
  goal: string;
  version: number;
  steps: PathStep[];
  rule_evaluation: RuleEvaluation;
  verifier_result: VerifierResult;
  teacher_audit_explanation: TeacherAuditExplanation;
  decision_trace_ids: string[];
};

type PathStep = {
  step_no: number;
  task_id: string;
  target_node_ids: string[];
  minutes: number;
  rationale: string;
  status: "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED" | "REVIEW_PENDING" | "WITHDRAWN";
};

type RuleEvaluation = {
  rule_version: string;
  recalled_task_ids: string[];
  excluded: { task_id: string; reason_code: string }[];
  component_scores: Record<string, number>;
  selected_task_ids: string[];
};

type VerifierResult = {
  verifier_version: string;
  status: "PASS" | "ADJUST" | "REPLAN" | "REVIEW" | "BLOCK";
  reasons: string[];
};

type TeacherAuditExplanation = {
  teacher_text: string;
  student_text: string;
  evidence_refs: string[];
  rule_refs: string[];
  excluded_task_refs: string[];
};

type ReviewCase = {
  review_case_id: string;
  object_type: "ContentVersion" | "TaskAnnotation" | "LearningPath" | "StudentSubmission" | "MediaUpload" | "LmsSync";
  object_id: string;
  severity: "REVIEW" | "BLOCK";
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  owner_user_id?: string;
  deadline_at?: string;
  status: "OPEN" | "ASSIGNED" | "IN_REVIEW" | "NEEDS_FIX" | "APPROVED" | "CONDITIONALLY_APPROVED" | "REJECTED" | "BLOCKED_FINAL" | "RESOLVED" | "REOPENED";
  reason_codes: string[];
  decision?: string;
};

type StudentSubmission = {
  submission_id: string;
  learner_id: string;
  task_id: string;
  path_id: string;
  path_version: number;
  status: "DRAFT" | "SUBMITTING" | "QUEUED_OFFLINE" | "RECEIVED" | "LINT_PASS" | "ISOLATED" | "REVIEW_PENDING" | "APPLIED" | "COMPLETED";
  response_payload_ref: string;
  evidence_ids: string[];
  idempotency_key: string;
};

type MediaUpload = {
  media_upload_id: string;
  submission_id: string;
  media_type: "audio" | "video" | "image";
  status: "PERMISSION_REQUIRED" | "RECORDING" | "RECORDED" | "UPLOADING" | "QUEUED_OFFLINE" | "UPLOADED" | "FAILED" | "REVIEW_PENDING";
  duration_seconds?: number;
  resume_token?: string;
};

type DecisionTrace = {
  trace_id: string;
  actor_user_id: string;
  action: "APPROVE" | "MODIFY" | "OVERRIDE" | "REJECT" | "CANCEL" | "REPLAN" | "SYSTEM_EVENT";
  reason_required: boolean;
  reason_text?: string;
  before_snapshot_ref: string;
  after_snapshot_ref?: string;
  rule_version?: string;
  lint_version?: string;
  verifier_version?: string;
  created_at: string;
};
```

## Personas
| Persona | Profile | Mock path | Task examples | State emphasis |
|---|---|---|---|---|
| Persona A | Vocabulary and foundational knowledge weak | `PTH01` 基础词汇与过程修复 | `UI01`, `UI02`, `UI03`, `UI10`, `UI17` | Low BKT on vocabulary/process nodes, low IRT theta |
| Persona B | Knowledge mostly stable but weak induction/inference | `PTH03` 阅读归纳与推断 | `UI04`, `UI09`, `UI16`, `UI20`, `RF04` | BKT sufficient on basics, Bloom analyze/evaluate emerging, thinking inference low |
| Persona C | Strong foundation, needs critique/creation tasks | `PTH05` 文化比较与写作; `PTH06` only as P1 project reference | `RW02`, `RW03`, `RW04`, `RW07`, `RW10`, `RW11`, `RW12`, `RW13` | Higher θ, BKT stable, critique/creation evidence incomplete |

## Fixture Rules
- Use real Unit 6 `Task_ID`, `Node_ID`, and `Path_ID` values from copied JSON/Excel.
- Use self-made placeholder text/media for public presentation.
- Do not store real names, student IDs, or real submissions.
- Do not compute real BKT, IRT, or rule scores; fixtures are deterministic examples only.
