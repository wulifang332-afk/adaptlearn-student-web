import { z } from "zod";
import {
  BLOOM_EVIDENCE_STATES,
  CONTENT_VERSION_STATES,
  DECISION_TRACE_ACTIONS,
  LEARNING_PATH_STATES,
  LINT_RESULT_STATUSES,
  LMS_SYNC_STATES,
  MEDIA_UPLOAD_STATES,
  PATH_STEP_STATES,
  REVIEW_CASE_STATES,
  SUBMISSION_STATES,
  TASK_ANNOTATION_STATES,
  THINKING_LEVELS,
  UI_STATES,
  USER_ROLES,
  VERIFIER_RESULT_STATUSES,
} from "../constants/index.js";
import { isLearningPathDeliverable } from "../guards/learning-path.js";

export const MOCK_SIMULATION_NOTICE = "Prototype data; not a real model result." as const;

export const MockMetaSchema = z.object({
  mock: z.literal(true),
  simulationNotice: z.literal(MOCK_SIMULATION_NOTICE),
});

export const mockApiResponseSchema = <Payload extends z.ZodTypeAny>(payload: Payload) =>
  MockMetaSchema.extend({ data: payload });

export type MockApiResponse<T> = {
  mock: true;
  simulationNotice: typeof MOCK_SIMULATION_NOTICE;
  data: T;
};

export const withMockMeta = <T>(data: T): MockApiResponse<T> => ({
  mock: true,
  simulationNotice: MOCK_SIMULATION_NOTICE,
  data,
});

export const UserRoleSchema = z.enum(USER_ROLES);
export const ReviewRiskCnSchema = z.enum(["低", "中", "高"]);
export const RiskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const PrioritySchema = z.enum(["P0", "P1"]);
export const LintStatusSchema = z.enum(LINT_RESULT_STATUSES);
export const VerifierStatusSchema = z.enum(VERIFIER_RESULT_STATUSES);
export const UiStateSchema = z.enum(UI_STATES);
export const ContentVersionStateSchema = z.enum(CONTENT_VERSION_STATES);
export const TaskAnnotationStateSchema = z.enum(TASK_ANNOTATION_STATES);
export const LearningPathStateSchema = z.enum(LEARNING_PATH_STATES);
export const ReviewCaseStateSchema = z.enum(REVIEW_CASE_STATES);
export const StudentSubmissionStateSchema = z.enum(SUBMISSION_STATES);
export const MediaUploadStateSchema = z.enum(MEDIA_UPLOAD_STATES);
export const LmsSyncStateSchema = z.enum(LMS_SYNC_STATES);
export const PathStepStateSchema = z.enum(PATH_STEP_STATES);
export const BloomEvidenceStateSchema = z.enum(BLOOM_EVIDENCE_STATES);
export const ThinkingLevelSchema = z.enum(THINKING_LEVELS);
export const DecisionTraceActionSchema = z.enum(DECISION_TRACE_ACTIONS);
type TeacherDecisionAction = "APPROVE" | "MODIFY" | "REJECT" | "REPLAN";
const isTeacherDecisionAction = (action: z.infer<typeof DecisionTraceActionSchema>): action is TeacherDecisionAction =>
  action === "APPROVE" || action === "MODIFY" || action === "REJECT" || action === "REPLAN";
const TeacherDecisionActionSchema = DecisionTraceActionSchema.refine(
  isTeacherDecisionAction,
  "Teacher decision action must be APPROVE, MODIFY, REJECT, or REPLAN",
);
const TeacherDecisionReasonSchema = z.string().trim().min(1, "Teacher decision reason is required");

export const UnitMetadataSchema = z.object({
  id: z.literal("U6"),
  title: z.literal("The Power of Plants"),
  grade: z.string(),
  scope: z.string(),
  algorithm_alignment: z.string(),
  copyright_note: z.string(),
});

export const UserSchema = z.object({
  user_id: z.string().min(1),
  role: UserRoleSchema,
  display_name: z.string().min(1),
  organization_id: z.string().min(1),
  class_ids: z.array(z.string().min(1)).optional(),
});

export const OrganizationSchema = z.object({
  organization_id: z.string().min(1),
  name: z.string().min(1),
  region_label: z.string().min(1),
});

export const ClassSchema = z.object({
  class_id: z.string().min(1),
  organization_id: z.string().min(1),
  grade: z.literal("七年级"),
  subject: z.literal("English"),
  teacher_user_ids: z.array(z.string().min(1)),
  student_ids: z.array(z.string().min(1)),
});

export const StudentSchema = z.object({
  student_id: z.string().min(1),
  class_id: z.string().min(1),
  pseudonymous_label: z.string().min(1),
  persona_id: z.enum(["persona_a", "persona_b", "persona_c"]),
});

export const KnowledgeNodeSchema = z.object({
  node_id: z.string().min(1),
  parent_id: z.string().min(1).optional(),
  level: z.string().min(1),
  module: z.string().min(1),
  dimension_l1: z.string().min(1),
  dimension_l2: z.string().min(1),
  name: z.string().min(1),
  english_label: z.string().optional(),
  definition: z.string(),
  source_evidence: z.string().optional(),
  bkt_eligible: z.boolean(),
  irt_eligible: z.boolean(),
  bloom_target: z.string().optional(),
  thinking_primary: z.string().optional(),
  thinking_secondary: z.string().optional(),
  learning_strategy_tags: z.array(z.string()),
  cognitive_strategy_tags: z.array(z.string()),
  evidence_task_types: z.array(z.string()),
  priority: PrioritySchema,
  review_risk: ReviewRiskCnSchema,
  notes: z.string().optional(),
});

export const KnowledgeEdgeSchema = z.object({
  edge_id: z.string().min(1),
  source_id: z.string().min(1),
  relation: z.string().min(1),
  target_id: z.string().min(1),
  module: z.string().min(1),
  rationale: z.string(),
});

export const BKTKnowledgeStateSchema = z.object({
  learner_id: z.string().min(1),
  node_id: z.string().min(1),
  mastery_probability: z.number().min(0).max(1),
  evidence_count: z.number().int().nonnegative(),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
  stability_label: z.enum(["INITIAL", "TENTATIVE", "UPDATED", "LOW_CONFIDENCE"]),
  parameter_version: z.string().min(1),
});

export const IRTAbilityStateSchema = z.object({
  learner_id: z.string().min(1),
  theta: z.number(),
  standard_error: z.number().positive(),
  calibration_status: z.enum(["EXPERT_PRIOR", "PILOT_TENTATIVE", "LOW_RISK_USE", "STABLE_TARGET"]),
  parameter_version: z.string().min(1),
});

export const BloomEvidenceProfileSchema = z.object({
  learner_id: z.string().min(1),
  node_id: z.string().min(1),
  remember: BloomEvidenceStateSchema,
  understand: BloomEvidenceStateSchema,
  apply: BloomEvidenceStateSchema,
  analyze: BloomEvidenceStateSchema,
  evaluate: BloomEvidenceStateSchema,
  create: BloomEvidenceStateSchema,
});

export const ThinkingQualityProfileSchema = z.object({
  learner_id: z.string().min(1),
  observation_discrimination: ThinkingLevelSchema,
  induction_inference: ThinkingLevelSchema,
  critique_creation: ThinkingLevelSchema,
  evidence_coverage: z.number().min(0).max(1),
  rubric_version: z.string().min(1),
});

export const LearnerProfileSchema = z.object({
  learner_id: z.string().min(1),
  class_id: z.string().min(1),
  active_path_id: z.string().min(1).optional(),
  bkt_states: z.array(BKTKnowledgeStateSchema),
  irt_state: IRTAbilityStateSchema,
  bloom_profile: z.array(BloomEvidenceProfileSchema),
  thinking_profile: ThinkingQualityProfileSchema,
  last_updated_at: z.string().datetime(),
});

export const TaskSchema = z.object({
  task_id: z.string().min(1),
  module: z.string().min(1),
  title: z.string().min(1),
  task_type: z.string().min(1),
  student_prompt: z.string().min(1),
  response_format: z.string().min(1),
  primary_node_ids: z.array(z.string().min(1)),
  secondary_node_ids: z.array(z.string().min(1)),
  language_skills: z.array(z.string()),
  bloom: z.string().min(1),
  thinking_primary: z.string().min(1),
  thinking_secondary: z.string().optional(),
  learning_strategy: z.array(z.string()),
  cognitive_strategy: z.array(z.string()),
  difficulty: z.enum(["非常容易", "容易", "中等", "困难", "非常困难"]),
  irt_b: z.number(),
  estimated_minutes: z.number().int().positive(),
  scoring_method: z.string().min(1),
  answer_key_or_rubric: z.string().min(1),
  hint_strategy: z.string().min(1),
  evidence_captured: z.array(z.string()),
  review_risk: ReviewRiskCnSchema,
  teacher_review: z.string().min(1),
  priority: PrioritySchema,
  copyright_status: z.string().min(1),
  notes: z.string().optional(),
});

export const TaskAnnotationSchema = z.object({
  annotation_id: z.string().min(1),
  task_id: z.string().min(1),
  knowledge_node_ids: z.array(z.string().min(1)),
  bloom_requirement: z.string().min(1),
  thinking_requirement: z.string().min(1),
  evidence_locations: z.array(z.string().min(1)),
  confidence: z.number().min(0).max(1),
  lint_status: LintStatusSchema,
  status: TaskAnnotationStateSchema,
});

export const PathStepSchema = z.object({
  step_no: z.number().int().positive(),
  task_id: z.string().min(1),
  target_node_ids: z.array(z.string().min(1)),
  minutes: z.number().int().positive(),
  rationale: z.string(),
  status: PathStepStateSchema,
});

export const RuleEvaluationSchema = z.object({
  rule_version: z.string().min(1),
  recalled_task_ids: z.array(z.string().min(1)),
  excluded: z.array(
    z.object({
      task_id: z.string().min(1),
      reason_code: z.string().min(1),
    }),
  ),
  component_scores: z.record(z.number()),
  selected_task_ids: z.array(z.string().min(1)),
});

export const VerifierResultSchema = z.object({
  verifier_version: z.string().min(1),
  status: VerifierStatusSchema,
  reasons: z.array(z.string()),
});

export const TeacherAuditExplanationSchema = z.object({
  teacher_text: z.string().min(1),
  student_text: z.string().min(1),
  evidence_refs: z.array(z.string().min(1)),
  rule_refs: z.array(z.string().min(1)),
  excluded_task_refs: z.array(z.string().min(1)),
});

export const LearningPathSchema = z
  .object({
    path_id: z.string().min(1),
    learner_id: z.string().min(1),
    source_path_id: z.string().min(1),
    status: LearningPathStateSchema,
    goal: z.string().min(1),
    version: z.number().int().positive(),
    steps: z.array(PathStepSchema).min(1),
    rule_evaluation: RuleEvaluationSchema,
    verifier_result: VerifierResultSchema,
    teacher_audit_explanation: TeacherAuditExplanationSchema,
    decision_trace_ids: z.array(z.string().min(1)),
  })
  .superRefine((path, context) => {
    if (path.status === "PUBLISHED" && !isLearningPathDeliverable(path)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["verifier_result", "status"],
        message: "PUBLISHED learning paths must have PASS verifier status and no blocking review state",
      });
    }
  });

export const ReviewCaseSchema = z.object({
  review_case_id: z.string().min(1),
  object_type: z.enum([
    "ContentVersion",
    "TaskAnnotation",
    "LearningPath",
    "StudentSubmission",
    "MediaUpload",
    "LmsSync",
  ]),
  object_id: z.string().min(1),
  severity: z.enum(["REVIEW", "BLOCK"]),
  risk_level: RiskLevelSchema,
  owner_user_id: z.string().min(1).optional(),
  deadline_at: z.string().datetime().optional(),
  status: ReviewCaseStateSchema,
  reason_codes: z.array(z.string().min(1)),
  decision: z.string().optional(),
});

export const StudentSubmissionSchema = z.object({
  submission_id: z.string().min(1),
  learner_id: z.string().min(1),
  task_id: z.string().min(1),
  path_id: z.string().min(1),
  path_version: z.number().int().positive(),
  status: StudentSubmissionStateSchema,
  response_payload_ref: z.string().min(1),
  evidence_ids: z.array(z.string().min(1)),
  idempotency_key: z.string().min(1),
});

export const MediaUploadSchema = z.object({
  media_upload_id: z.string().min(1),
  submission_id: z.string().min(1),
  media_type: z.enum(["audio", "video", "image"]),
  status: MediaUploadStateSchema,
  duration_seconds: z.number().int().positive().max(120).optional(),
  resume_token: z.string().min(1).optional(),
});

export const DecisionTraceSchema = z
  .object({
    trace_id: z.string().min(1),
    actor_user_id: z.string().min(1),
    action: DecisionTraceActionSchema,
    reason_required: z.boolean(),
    reason_text: z.string().trim().min(1).optional(),
    before_snapshot_ref: z.string().min(1),
    after_snapshot_ref: z.string().min(1).optional(),
    rule_version: z.string().min(1).optional(),
    lint_version: z.string().min(1).optional(),
    verifier_version: z.string().min(1).optional(),
    created_at: z.string().datetime(),
  })
  .superRefine((trace, context) => {
    if ((trace.action === "OVERRIDE" || trace.reason_required) && !trace.reason_text) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason_text"],
        message: "DecisionTrace reason_text is required for OVERRIDE or reason_required actions",
      });
    }
  });

export const TeacherDecisionInputSchema = z
  .object({
    actor_user_id: z.string().min(1),
    path_id: z.string().min(1),
    path_version: z.number().int().positive(),
    action: TeacherDecisionActionSchema,
    reason: z.string().trim().optional(),
  })
  .superRefine((decision, context) => {
    if (decision.action === "APPROVE") {
      return;
    }

    const reason = TeacherDecisionReasonSchema.safeParse(decision.reason);
    if (!reason.success) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: `${decision.action} requires a non-empty teacher reason`,
      });
    }
  });

export const LmsSyncStatusSchema = z.object({
  sync_id: z.string().min(1),
  object_type: z.enum(["LearningPath", "StudentSubmission", "ClassSummary"]),
  object_id: z.string().min(1),
  status: LmsSyncStateSchema,
  retry_count: z.number().int().nonnegative(),
  last_attempt_at: z.string().datetime().optional(),
  next_retry_at: z.string().datetime().optional(),
  review_case_id: z.string().min(1).optional(),
});

export const TraceEventSchema = z.object({
  trace_id: z.string().min(1),
  flow_id: z.string().min(1),
  object_id: z.string().min(1),
  status: z.enum(["HEALTHY", "DEGRADED", "FAILED", "DEAD_LETTER", "COMPENSATED"]),
  message: z.string().min(1),
  created_at: z.string().datetime(),
});

export const SamplePathRowSchema = z.object({
  path_id: z.string().min(1),
  path_name: z.string().min(1),
  trigger_condition: z.string().min(1),
  step_no: z.number().int().positive(),
  task_id: z.string().min(1),
  task_title: z.string().min(1),
  minutes: z.number().int().positive(),
  target_node_ids: z.array(z.string().min(1)),
  difficulty: z.string().min(1),
  rule_rationale: z.string(),
  teacher_action: z.string().min(1),
});

export const PersonaSchema = z.object({
  persona_id: z.enum(["persona_a", "persona_b", "persona_c"]),
  label: z.string().min(1),
  profile: z.string().min(1),
  mock_path_ids: z.array(z.string().min(1)).min(1),
  task_examples: z.array(z.string().min(1)).min(1),
  state_emphasis: z.string().min(1),
});

export const SourceCountsSchema = z.object({
  nodes: z.literal(128),
  edges: z.literal(669),
  tasks: z.literal(91),
  sample_path_rows: z.literal(36),
});

export const Unit6FixtureSchema = MockMetaSchema.extend({
  generated_at: z.string().datetime(),
  source_counts: SourceCountsSchema,
  unit: UnitMetadataSchema,
  knowledge_nodes: z.array(KnowledgeNodeSchema).length(128),
  knowledge_edges: z.array(KnowledgeEdgeSchema).length(669),
  tasks: z.array(TaskSchema).length(91),
  sample_path_rows: z.array(SamplePathRowSchema).length(36),
  task_annotations: z.array(TaskAnnotationSchema).length(91),
  organizations: z.array(OrganizationSchema),
  classes: z.array(ClassSchema),
  users: z.array(UserSchema),
  students: z.array(StudentSchema),
  learner_profiles: z.array(LearnerProfileSchema),
  learning_paths: z.array(LearningPathSchema),
  review_cases: z.array(ReviewCaseSchema),
  submissions: z.array(StudentSubmissionSchema),
  media_uploads: z.array(MediaUploadSchema),
  decision_traces: z.array(DecisionTraceSchema),
  lms_sync_statuses: z.array(LmsSyncStatusSchema),
  trace_events: z.array(TraceEventSchema),
  personas: z.array(PersonaSchema).length(3),
});
