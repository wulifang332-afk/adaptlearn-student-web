import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MOCK_SIMULATION_NOTICE, Unit6FixtureSchema } from "../src/schemas/index.js";

type SourceRow = Record<string, unknown>;

type SourceData = {
  unit: SourceRow;
  nodes: SourceRow[];
  edges: SourceRow[];
  tasks: SourceRow[];
  sample_paths: SourceRow[];
};

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SHARED_ROOT = resolve(SCRIPT_DIR, "..");
const SOURCE_JSON = resolve(SHARED_ROOT, "../../docs/data/AdaptLearn_Unit6_KnowledgeGraph.json");
const OUTPUT_JSON = resolve(SHARED_ROOT, "generated/unit6-normalized.json");
const GENERATED_AT = "2026-06-23T04:30:00.000Z";

const text = (row: SourceRow, key: string): string => {
  const value = row[key];
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  throw new Error(`Missing text field ${key}`);
};

const optionalText = (row: SourceRow, key: string): string | undefined => {
  const value = row[key];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return undefined;
};

const numberField = (row: SourceRow, key: string): number => {
  const value = row[key];
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  throw new Error(`Missing numeric field ${key}`);
};

const splitList = (value: string | undefined): string[] =>
  value
    ? value
        .split("|")
        .map((part) => part.trim())
        .filter(Boolean)
    : [];

const yesNo = (value: string): boolean => value === "是";

const riskLevel = (risk: "低" | "中" | "高"): "LOW" | "MEDIUM" | "HIGH" => {
  if (risk === "低") return "LOW";
  if (risk === "中") return "MEDIUM";
  return "HIGH";
};

const riskConfidence = (risk: "低" | "中" | "高"): number => {
  if (risk === "低") return 0.88;
  if (risk === "中") return 0.74;
  return 0.58;
};

const annotationStatus = (taskId: string, risk: "低" | "中" | "高") => {
  if (taskId === "RW12") {
    return { lint_status: "REVIEW" as const, status: "REVIEW_REQUIRED" as const };
  }
  if (risk === "低") {
    return { lint_status: "INFO" as const, status: "APPROVED" as const };
  }
  return { lint_status: "WARN" as const, status: "APPROVED" as const };
};

const readSourceData = (): SourceData => JSON.parse(readFileSync(SOURCE_JSON, "utf8")) as SourceData;

const makeBktStates = (
  learnerId: string,
  nodeIds: string[],
  profile: "foundation_gap" | "inference_gap" | "creation_gap",
) =>
  nodeIds.map((nodeId, index) => {
    const foundationGap = profile === "foundation_gap";
    const inferenceGap = profile === "inference_gap";
    const mastery = foundationGap ? 0.42 + index * 0.03 : inferenceGap ? 0.68 + index * 0.02 : 0.82 + index * 0.01;
    return {
      learner_id: learnerId,
      node_id: nodeId,
      mastery_probability: Number(Math.min(mastery, 0.92).toFixed(2)),
      evidence_count: foundationGap ? 2 : inferenceGap ? 5 : 7,
      confidence: foundationGap ? ("LOW" as const) : inferenceGap ? ("MEDIUM" as const) : ("HIGH" as const),
      stability_label: foundationGap
        ? ("LOW_CONFIDENCE" as const)
        : inferenceGap
          ? ("TENTATIVE" as const)
          : ("UPDATED" as const),
      parameter_version: "mock-bkt-v0",
    };
  });

const makeBloomProfiles = (
  learnerId: string,
  nodeIds: string[],
  profile: "foundation_gap" | "inference_gap" | "creation_gap",
) =>
  nodeIds.map((nodeId) => ({
    learner_id: learnerId,
    node_id: nodeId,
    remember: profile === "foundation_gap" ? ("INSUFFICIENT" as const) : ("CONFIRMED" as const),
    understand: profile === "foundation_gap" ? ("EMERGING" as const) : ("CONFIRMED" as const),
    apply: profile === "foundation_gap" ? ("INSUFFICIENT" as const) : ("EMERGING" as const),
    analyze: profile === "inference_gap" ? ("EMERGING" as const) : profile === "creation_gap" ? ("CONFIRMED" as const) : ("NOT_ASSESSED" as const),
    evaluate: profile === "creation_gap" ? ("EMERGING" as const) : ("NOT_ASSESSED" as const),
    create: profile === "creation_gap" ? ("INSUFFICIENT" as const) : ("NOT_ASSESSED" as const),
  }));

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const first = <T>(values: T[], label: string): T => {
  const value = values[0];
  if (!value) {
    throw new Error(`Missing ${label}`);
  }
  return value;
};

const source = readSourceData();

const unit = {
  id: "U6" as const,
  title: "The Power of Plants" as const,
  grade: text(source.unit, "grade"),
  scope: text(source.unit, "scope"),
  algorithm_alignment: text(source.unit, "algorithm_alignment"),
  copyright_note: text(source.unit, "copyright_note"),
};

const knowledgeNodes = source.nodes.map((row) => {
  const parentId = optionalText(row, "Parent_ID");
  const englishLabel = optionalText(row, "English_Label");
  const sourceEvidence = optionalText(row, "Source_Evidence");
  const bloomTarget = optionalText(row, "Bloom_Target");
  const thinkingPrimary = optionalText(row, "Thinking_Primary");
  const thinkingSecondary = optionalText(row, "Thinking_Secondary");
  const notes = optionalText(row, "Notes");

  return {
    node_id: text(row, "Node_ID"),
    ...(parentId ? { parent_id: parentId } : {}),
    level: text(row, "Node_Level"),
    module: text(row, "Module"),
    dimension_l1: text(row, "Dimension_L1"),
    dimension_l2: text(row, "Dimension_L2"),
    name: text(row, "Node_Name"),
    ...(englishLabel ? { english_label: englishLabel } : {}),
    definition: text(row, "Definition"),
    ...(sourceEvidence ? { source_evidence: sourceEvidence } : {}),
    bkt_eligible: yesNo(text(row, "BKT_Eligible")),
    irt_eligible: yesNo(text(row, "IRT_Eligible")),
    ...(bloomTarget ? { bloom_target: bloomTarget } : {}),
    ...(thinkingPrimary ? { thinking_primary: thinkingPrimary } : {}),
    ...(thinkingSecondary ? { thinking_secondary: thinkingSecondary } : {}),
    learning_strategy_tags: splitList(optionalText(row, "Learning_Strategy_Tags")),
    cognitive_strategy_tags: splitList(optionalText(row, "Cognitive_Strategy_Tags")),
    evidence_task_types: splitList(optionalText(row, "Evidence_Task_Types")),
    priority: text(row, "Priority") as "P0" | "P1",
    review_risk: text(row, "Review_Risk") as "低" | "中" | "高",
    ...(notes ? { notes } : {}),
  };
});

const knowledgeEdges = source.edges.map((row, index) => ({
  edge_id: `${text(row, "Source_ID")}::${text(row, "Relation")}::${text(row, "Target_ID")}::${index + 1}`,
  source_id: text(row, "Source_ID"),
  relation: text(row, "Relation"),
  target_id: text(row, "Target_ID"),
  module: text(row, "Module"),
  rationale: text(row, "Rationale"),
}));

const tasks = source.tasks.map((row) => {
  const thinkingSecondary = optionalText(row, "Thinking_Secondary");
  const notes = optionalText(row, "Notes");
  return {
    task_id: text(row, "Task_ID"),
    module: text(row, "Module"),
    title: text(row, "Task_Title"),
    task_type: text(row, "Task_Type"),
    student_prompt: text(row, "Student_Prompt"),
    response_format: text(row, "Response_Format"),
    primary_node_ids: splitList(optionalText(row, "Primary_Node_IDs")),
    secondary_node_ids: splitList(optionalText(row, "Secondary_Node_IDs")),
    language_skills: splitList(optionalText(row, "Language_Skills")),
    bloom: text(row, "Bloom"),
    thinking_primary: text(row, "Thinking_Primary"),
    ...(thinkingSecondary ? { thinking_secondary: thinkingSecondary } : {}),
    learning_strategy: splitList(optionalText(row, "Learning_Strategy")),
    cognitive_strategy: splitList(optionalText(row, "Cognitive_Strategy")),
    difficulty: text(row, "Difficulty") as "非常容易" | "容易" | "中等" | "困难" | "非常困难",
    irt_b: numberField(row, "IRT_b"),
    estimated_minutes: numberField(row, "Estimated_Minutes"),
    scoring_method: text(row, "Scoring_Method"),
    answer_key_or_rubric: text(row, "Answer_Key_or_Rubric"),
    hint_strategy: text(row, "Hint_Strategy"),
    evidence_captured: splitList(optionalText(row, "Evidence_Captured")),
    review_risk: text(row, "Review_Risk") as "低" | "中" | "高",
    teacher_review: text(row, "Teacher_Review"),
    priority: text(row, "Priority") as "P0" | "P1",
    copyright_status: text(row, "Copyright_Status"),
    ...(notes ? { notes } : {}),
  };
});

const samplePathRows = source.sample_paths.map((row) => ({
  path_id: text(row, "Path_ID"),
  path_name: text(row, "Path_Name"),
  trigger_condition: text(row, "Trigger_Condition"),
  step_no: numberField(row, "Step_No"),
  task_id: text(row, "Task_ID"),
  task_title: text(row, "Task_Title"),
  minutes: numberField(row, "Minutes"),
  target_node_ids: splitList(optionalText(row, "Target_Nodes")),
  difficulty: text(row, "Difficulty"),
  rule_rationale: optionalText(row, "Rule_Rationale") ?? "",
  teacher_action: text(row, "Teacher_Action"),
}));

const taskAnnotations = tasks.map((task) => {
  const state = annotationStatus(task.task_id, task.review_risk);
  return {
    annotation_id: `ann_${task.task_id}`,
    task_id: task.task_id,
    knowledge_node_ids: unique([...task.primary_node_ids, ...task.secondary_node_ids]),
    bloom_requirement: task.bloom,
    thinking_requirement: task.thinking_secondary
      ? `${task.thinking_primary}|${task.thinking_secondary}`
      : task.thinking_primary,
    evidence_locations: ["student_prompt", "answer_key_or_rubric", "evidence_captured"],
    confidence: riskConfidence(task.review_risk),
    lint_status: state.lint_status,
    status: state.status,
  };
});

const organizations = [
  {
    organization_id: "org_adaptlearn_demo",
    name: "AdaptLearn Phase 0 Demo School",
    region_label: "Prototype region",
  },
];

const users = [
  {
    user_id: "usr_teacher_01",
    role: "teacher" as const,
    display_name: "Teacher Demo",
    organization_id: "org_adaptlearn_demo",
    class_ids: ["cls_grade7_u6"],
  },
  {
    user_id: "usr_researcher_01",
    role: "curriculum_researcher" as const,
    display_name: "Curriculum Researcher Demo",
    organization_id: "org_adaptlearn_demo",
  },
  {
    user_id: "usr_expert_01",
    role: "expert" as const,
    display_name: "Expert Demo",
    organization_id: "org_adaptlearn_demo",
  },
  {
    user_id: "usr_admin_01",
    role: "admin" as const,
    display_name: "System Admin Demo",
    organization_id: "org_adaptlearn_demo",
  },
];

const students = [
  {
    student_id: "stu_persona_a",
    class_id: "cls_grade7_u6",
    pseudonymous_label: "Persona A",
    persona_id: "persona_a" as const,
  },
  {
    student_id: "stu_persona_b",
    class_id: "cls_grade7_u6",
    pseudonymous_label: "Persona B",
    persona_id: "persona_b" as const,
  },
  {
    student_id: "stu_persona_c",
    class_id: "cls_grade7_u6",
    pseudonymous_label: "Persona C",
    persona_id: "persona_c" as const,
  },
];

const classes = [
  {
    class_id: "cls_grade7_u6",
    organization_id: "org_adaptlearn_demo",
    grade: "七年级" as const,
    subject: "English" as const,
    teacher_user_ids: ["usr_teacher_01"],
    student_ids: students.map((student) => student.student_id),
  },
];

const personas = [
  {
    persona_id: "persona_a" as const,
    label: "Persona A",
    profile: "Vocabulary and foundational knowledge weak",
    mock_path_ids: ["PTH01"],
    task_examples: ["UI01", "UI02", "UI03", "UI10", "UI17"],
    state_emphasis: "Low BKT on vocabulary/process nodes, low IRT theta",
  },
  {
    persona_id: "persona_b" as const,
    label: "Persona B",
    profile: "Knowledge mostly stable but weak induction/inference",
    mock_path_ids: ["PTH03"],
    task_examples: ["UI04", "UI09", "UI16", "UI20", "RF04"],
    state_emphasis: "BKT sufficient on basics, Bloom analyze/evaluate emerging, thinking inference low",
  },
  {
    persona_id: "persona_c" as const,
    label: "Persona C",
    profile: "Strong foundation, needs critique/creation tasks",
    mock_path_ids: ["PTH05", "PTH06"],
    task_examples: ["RW02", "RW03", "RW04", "RW07", "RW10", "RW11", "RW12", "RW13"],
    state_emphasis: "Higher theta, BKT stable, critique/creation evidence incomplete",
  },
];

type SamplePathFixtureRow = (typeof samplePathRows)[number];

const rowsByPath = new Map<string, SamplePathFixtureRow[]>();
for (const row of samplePathRows) {
  rowsByPath.set(row.path_id, [...(rowsByPath.get(row.path_id) ?? []), row]);
}

const pathRows = (pathId: string): SamplePathFixtureRow[] => {
  const rows = rowsByPath.get(pathId);
  if (!rows) {
    throw new Error(`Missing sample path ${pathId}`);
  }
  return [...rows].sort((a, b) => a.step_no - b.step_no);
};

const learnerConfigs = [
  {
    learner_id: "stu_persona_a",
    path_id: "PTH01",
    stateProfile: "foundation_gap" as const,
    theta: -0.95,
    standard_error: 0.58,
    thinking: {
      observation_discrimination: "T1" as const,
      induction_inference: "T0" as const,
      critique_creation: "EVIDENCE_INSUFFICIENT" as const,
      evidence_coverage: 0.32,
    },
  },
  {
    learner_id: "stu_persona_b",
    path_id: "PTH03",
    stateProfile: "inference_gap" as const,
    theta: 0.05,
    standard_error: 0.42,
    thinking: {
      observation_discrimination: "T2" as const,
      induction_inference: "T1" as const,
      critique_creation: "T1" as const,
      evidence_coverage: 0.54,
    },
  },
  {
    learner_id: "stu_persona_c",
    path_id: "PTH05",
    stateProfile: "creation_gap" as const,
    theta: 0.82,
    standard_error: 0.36,
    thinking: {
      observation_discrimination: "T3" as const,
      induction_inference: "T3" as const,
      critique_creation: "T2" as const,
      evidence_coverage: 0.71,
    },
  },
];

const learnerProfiles = learnerConfigs.map((config) => {
  const targetNodeIds = unique(pathRows(config.path_id).flatMap((row) => row.target_node_ids));
  return {
    learner_id: config.learner_id,
    class_id: "cls_grade7_u6",
    active_path_id: config.path_id,
    bkt_states: makeBktStates(config.learner_id, targetNodeIds, config.stateProfile),
    irt_state: {
      learner_id: config.learner_id,
      theta: config.theta,
      standard_error: config.standard_error,
      calibration_status: "PILOT_TENTATIVE" as const,
      parameter_version: "mock-irt-1pl-v0",
    },
    bloom_profile: makeBloomProfiles(config.learner_id, targetNodeIds, config.stateProfile),
    thinking_profile: {
      learner_id: config.learner_id,
      ...config.thinking,
      rubric_version: "mock-thinking-rubric-v0",
    },
    last_updated_at: GENERATED_AT,
  };
});

const decisionTraces = learnerConfigs.map((config) => ({
  trace_id: `trace_${config.path_id}_publish`,
  actor_user_id: "usr_teacher_01",
  action: "APPROVE" as const,
  reason_required: true,
  reason_text: "Teacher approved static Phase 0 mock path after reviewing evidence sufficiency.",
  before_snapshot_ref: `learning_path:${config.path_id}:teacher_review`,
  after_snapshot_ref: `learning_path:${config.path_id}:published:v1`,
  rule_version: "mock-rule-v0",
  verifier_version: "mock-verifier-v0",
  created_at: GENERATED_AT,
}));

const learningPaths = learnerConfigs.map((config) => {
  const rows = pathRows(config.path_id);
  const selectedTaskIds = rows.map((row) => row.task_id);
  const pathName = first(rows, config.path_id).path_name;

  return {
    path_id: config.path_id,
    learner_id: config.learner_id,
    source_path_id: config.path_id,
    status: "PUBLISHED" as const,
    goal: pathName,
    version: 1,
    steps: rows.map((row, index) => ({
      step_no: row.step_no,
      task_id: row.task_id,
      target_node_ids: row.target_node_ids,
      minutes: row.minutes,
      rationale: row.rule_rationale || first(rows, config.path_id).rule_rationale,
      status: index === 0 ? ("AVAILABLE" as const) : ("LOCKED" as const),
    })),
    rule_evaluation: {
      rule_version: "mock-rule-v0",
      recalled_task_ids: selectedTaskIds,
      excluded: [],
      component_scores: {
        prerequisite_fit: config.stateProfile === "foundation_gap" ? 0.62 : 0.77,
        difficulty_fit: config.stateProfile === "creation_gap" ? 0.81 : 0.7,
        teacher_constraint_fit: 1,
      },
      selected_task_ids: selectedTaskIds,
    },
    verifier_result: {
      verifier_version: "mock-verifier-v0",
      status: "PASS" as const,
      reasons: ["Static prototype verifier result; no real recommendation model was run."],
    },
    teacher_audit_explanation: {
      teacher_text: `Mock path ${config.path_id} uses Unit 6 sample rows and remains teacher-approved only.`,
      student_text: `This path starts with tasks matched to your current Unit 6 practice needs.`,
      evidence_refs: learnerProfiles
        .find((profile) => profile.learner_id === config.learner_id)!
        .bkt_states.slice(0, 3)
        .map((state) => `bkt:${state.node_id}`),
      rule_refs: ["mock-rule-v0"],
      excluded_task_refs: [],
    },
    decision_trace_ids: [`trace_${config.path_id}_publish`],
  };
});

const submissions = [
  {
    submission_id: "sub_persona_a_ui01",
    learner_id: "stu_persona_a",
    task_id: "UI01",
    path_id: "PTH01",
    path_version: 1,
    status: "COMPLETED" as const,
    response_payload_ref: "mock://responses/persona_a/ui01",
    evidence_ids: ["ev_persona_a_ui01"],
    idempotency_key: "idem_persona_a_ui01",
  },
  {
    submission_id: "sub_persona_b_ui20",
    learner_id: "stu_persona_b",
    task_id: "UI20",
    path_id: "PTH03",
    path_version: 1,
    status: "REVIEW_PENDING" as const,
    response_payload_ref: "mock://responses/persona_b/ui20",
    evidence_ids: ["ev_persona_b_ui20"],
    idempotency_key: "idem_persona_b_ui20",
  },
  {
    submission_id: "sub_persona_c_rw12",
    learner_id: "stu_persona_c",
    task_id: "RW12",
    path_id: "PTH05",
    path_version: 1,
    status: "REVIEW_PENDING" as const,
    response_payload_ref: "mock://responses/persona_c/rw12",
    evidence_ids: ["ev_persona_c_rw12"],
    idempotency_key: "idem_persona_c_rw12",
  },
];

const mediaUploads = [
  {
    media_upload_id: "media_persona_a_ui17",
    submission_id: "sub_persona_a_ui17_draft",
    media_type: "audio" as const,
    status: "QUEUED_OFFLINE" as const,
    duration_seconds: 42,
    resume_token: "mock_resume_persona_a_ui17",
  },
];

const reviewCases = [
  {
    review_case_id: "rc_ann_rw12",
    object_type: "TaskAnnotation" as const,
    object_id: "ann_RW12",
    severity: "REVIEW" as const,
    risk_level: "HIGH" as const,
    owner_user_id: "usr_researcher_01",
    deadline_at: "2026-06-24T04:30:00.000Z",
    status: "ASSIGNED" as const,
    reason_codes: ["ANNOTATION_HIGH_RISK_WRITING", "REVIEW_REQUIRED"],
  },
  {
    review_case_id: "rc_sub_persona_c_rw12",
    object_type: "StudentSubmission" as const,
    object_id: "sub_persona_c_rw12",
    severity: "REVIEW" as const,
    risk_level: "HIGH" as const,
    owner_user_id: "usr_teacher_01",
    deadline_at: "2026-06-24T04:30:00.000Z",
    status: "OPEN" as const,
    reason_codes: ["HIGH_RISK_WRITING_OUTPUT", "TEACHER_REVIEW_REQUIRED"],
  },
  {
    review_case_id: "rc_lms_dead_letter",
    object_type: "LmsSync" as const,
    object_id: "sync_persona_b_path",
    severity: "REVIEW" as const,
    risk_level: "MEDIUM" as const,
    owner_user_id: "usr_admin_01",
    deadline_at: "2026-06-24T04:30:00.000Z",
    status: "IN_REVIEW" as const,
    reason_codes: ["STATIC_LMS_SYNC_FAILURE"],
  },
];

const lmsSyncStatuses = [
  {
    sync_id: "sync_persona_a_path",
    object_type: "LearningPath" as const,
    object_id: "PTH01",
    status: "SYNCED" as const,
    retry_count: 0,
    last_attempt_at: GENERATED_AT,
  },
  {
    sync_id: "sync_persona_b_path",
    object_type: "LearningPath" as const,
    object_id: "PTH03",
    status: "DEAD_LETTER" as const,
    retry_count: 3,
    last_attempt_at: GENERATED_AT,
    review_case_id: "rc_lms_dead_letter",
  },
  {
    sync_id: "sync_persona_c_submission",
    object_type: "StudentSubmission" as const,
    object_id: "sub_persona_c_rw12",
    status: "RETRY_WAITING" as const,
    retry_count: 1,
    last_attempt_at: GENERATED_AT,
    next_retry_at: "2026-06-23T05:00:00.000Z",
  },
];

const traceEvents = [
  {
    trace_id: "trace_flow_path_persona_a",
    flow_id: "FLOW-PATH-01",
    object_id: "PTH01",
    status: "HEALTHY" as const,
    message: "Static path fixture available for Persona A.",
    created_at: GENERATED_AT,
  },
  {
    trace_id: "trace_flow_feedback_persona_c",
    flow_id: "FLOW-FEEDBACK-01",
    object_id: "sub_persona_c_rw12",
    status: "DEGRADED" as const,
    message: "High-risk writing fixture routes to teacher review.",
    created_at: GENERATED_AT,
  },
  {
    trace_id: "trace_flow_lms_persona_b",
    flow_id: "FLOW-LMS-01",
    object_id: "sync_persona_b_path",
    status: "DEAD_LETTER" as const,
    message: "Static LMS sync failure fixture for monitoring UI.",
    created_at: GENERATED_AT,
  },
];

const fixture = {
  mock: true as const,
  simulationNotice: MOCK_SIMULATION_NOTICE,
  generated_at: GENERATED_AT,
  source_counts: {
    nodes: 128 as const,
    edges: 669 as const,
    tasks: 91 as const,
    sample_path_rows: 36 as const,
  },
  unit,
  knowledge_nodes: knowledgeNodes,
  knowledge_edges: knowledgeEdges,
  tasks,
  sample_path_rows: samplePathRows,
  task_annotations: taskAnnotations,
  organizations,
  classes,
  users,
  students,
  learner_profiles: learnerProfiles,
  learning_paths: learningPaths,
  review_cases: reviewCases,
  submissions,
  media_uploads: mediaUploads,
  decision_traces: decisionTraces,
  lms_sync_statuses: lmsSyncStatuses,
  trace_events: traceEvents,
  personas,
};

const parsed = Unit6FixtureSchema.parse(fixture);
mkdirSync(dirname(OUTPUT_JSON), { recursive: true });
writeFileSync(OUTPUT_JSON, `${JSON.stringify(parsed, null, 2)}\n`);

console.log(
  `Generated ${OUTPUT_JSON}: ${parsed.knowledge_nodes.length} nodes, ${parsed.knowledge_edges.length} edges, ${parsed.tasks.length} tasks, ${parsed.sample_path_rows.length} sample path rows.`,
);
