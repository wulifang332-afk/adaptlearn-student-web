import { buildStudentSafeProjection, canPublishLearningPath, createDecisionTrace } from "./admin-workflows";
import type {
  AdminScope,
  DashboardMetric,
  DecisionTrace,
  LearningPathReviewRecord,
  ReviewCase,
  StaffRole,
  StatusTone,
} from "./admin-types";

type AdminDisplayTask = {
  task_id: string;
  title: string;
  module: string;
  task_type: string;
  estimated_minutes: number;
  bloom: string;
  thinking_primary: string;
  node_labels: string[];
};

const unit6 = {
  id: "U6",
  title: "The Power of Plants",
} as const;

const displayTasks: Record<string, AdminDisplayTask> = {
  UI01: {
    task_id: "UI01",
    title: "Label the parts of a plant",
    module: "Plant vocabulary",
    task_type: "Word-picture matching",
    estimated_minutes: 4,
    bloom: "Remember",
    thinking_primary: "Observation",
    node_labels: ["Root", "Stem", "Leaf", "Seed"],
  },
  UI02: {
    task_id: "UI02",
    title: "Classify photosynthesis inputs and outputs",
    module: "Photosynthesis",
    task_type: "Classification",
    estimated_minutes: 5,
    bloom: "Understand",
    thinking_primary: "Compare",
    node_labels: ["Sunlight", "Water", "Carbon dioxide", "Oxygen"],
  },
  UI03: {
    task_id: "UI03",
    title: "Build the photosynthesis process",
    module: "Photosynthesis",
    task_type: "Process sequencing",
    estimated_minutes: 6,
    bloom: "Analyze",
    thinking_primary: "Sequence",
    node_labels: ["Photosynthesis sequence", "Glucose", "Oxygen"],
  },
  UI08: {
    task_id: "UI08",
    title: "Explain the effect of missing sunlight",
    module: "Photosynthesis",
    task_type: "Cause/effect multiple choice",
    estimated_minutes: 5,
    bloom: "Analyze",
    thinking_primary: "Cause and effect",
    node_labels: ["Sunlight", "Glucose", "Plant growth"],
  },
  UI04: {
    task_id: "UI04",
    title: "Choose the strongest plant explanation",
    module: "Scientific explanation",
    task_type: "Explanation evaluation",
    estimated_minutes: 7,
    bloom: "Evaluate",
    thinking_primary: "Evidence reasoning",
    node_labels: ["Scientific explanation", "Evidence selection"],
  },
  UI17: {
    task_id: "UI17",
    title: "Oral retelling of photosynthesis",
    module: "Speaking",
    task_type: "Oral retelling",
    estimated_minutes: 8,
    bloom: "Apply",
    thinking_primary: "Retell with evidence",
    node_labels: ["Oral retelling", "Process explanation"],
  },
};

const displayTaskIds = ["UI01", "UI02", "UI03", "UI08", "UI04", "UI17"] as const;

const getTask = (taskId: string) => displayTasks[taskId] ?? displayTasks.UI01;

export const staffRoleLabels: Record<StaffRole, string> = {
  teacher: "English teacher",
  curriculum_researcher: "Curriculum researcher",
  expert: "Expert reviewer",
  admin: "System admin",
};

export const activeScope: AdminScope = {
  organizationId: "org_greenwood",
  organizationName: "Greenwood Middle School",
  role: "teacher",
  roleLabel: staffRoleLabels.teacher,
  classId: "class_g7_a",
  classLabel: "Grade 7 English A",
  reviewScope: "Assigned class paths and outputs",
  mockMode: true,
};

export const alternateScopes: AdminScope[] = [
  activeScope,
  {
    organizationId: "org_greenwood",
    organizationName: "Greenwood Middle School",
    role: "curriculum_researcher",
    roleLabel: staffRoleLabels.curriculum_researcher,
    reviewScope: "Unit 6 content, taxonomy, annotation, research",
    mockMode: true,
  },
  {
    organizationId: "org_greenwood",
    organizationName: "Greenwood Middle School",
    role: "expert",
    roleLabel: staffRoleLabels.expert,
    reviewScope: "High-risk annotation and research evidence",
    mockMode: true,
  },
  {
    organizationId: "org_greenwood",
    organizationName: "Greenwood Middle School",
    role: "admin",
    roleLabel: staffRoleLabels.admin,
    reviewScope: "Business monitoring and assignment",
    mockMode: true,
  },
];

export const reviewCases: ReviewCase[] = [
  {
    review_case_id: "rc_path_sunlight_review",
    object_type: "LearningPath",
    object_id: "pth_xiaoming_u6_v3",
    object_label: "Xiaoming Zhang - Unit 6 plant process path",
    queue_label: "Learning path blocked before publication",
    severity: "REVIEW",
    risk_level: "MEDIUM",
    owner_user_id: "usr_teacher_lina",
    owner_label: "Lina Chen",
    deadline_at: "2026-06-27T09:00:00.000Z",
    status: "IN_REVIEW",
    reason_codes: ["PATH_LINT_REVIEW", "SPEAKING_TASK_REVIEW_REQUIRED"],
    teacher_readable_reason: "Oral retelling feedback needs teacher confirmation before this path can be published.",
    source_version: "path v3",
    trace_link: "/foundation/audit/traces/trc_path_sunlight_review",
  },
  {
    review_case_id: "rc_annotation_high_risk",
    object_type: "TaskAnnotation",
    object_id: "UI17:annotation",
    object_label: "Oral retelling - evidence and speaking annotation",
    queue_label: "High-risk annotation case",
    severity: "BLOCK",
    risk_level: "HIGH",
    owner_user_id: "usr_expert_maya",
    owner_label: "Maya Singh",
    deadline_at: "2026-06-27T16:00:00.000Z",
    status: "ASSIGNED",
    reason_codes: ["LOW_CONFIDENCE_SPEAKING_RUBRIC", "EXPERT_REVIEW_REQUIRED"],
    teacher_readable_reason: "Speaking rubric alignment is blocked until the expert clears the annotation.",
    source_version: "annotation candidate 2",
    trace_link: "/foundation/audit/traces/trc_annotation_high_risk",
  },
  {
    review_case_id: "rc_content_copyright",
    object_type: "ContentVersion",
    object_id: "cnt_u6_daylight_v2",
    object_label: "Daylight and plant growth reading",
    queue_label: "Content or copyright issue",
    severity: "REVIEW",
    risk_level: "MEDIUM",
    owner_user_id: "usr_researcher_hao",
    owner_label: "Hao Lin",
    deadline_at: "2026-06-28T03:00:00.000Z",
    status: "NEEDS_FIX",
    reason_codes: ["MISSING_SOURCE_PAGE", "COPYRIGHT_STATUS_UNKNOWN"],
    teacher_readable_reason: "Source page and copyright status must be fixed before publication.",
    source_version: "content v2",
  },
  {
    review_case_id: "rc_lms_dead_letter",
    object_type: "LmsSync",
    object_id: "sync_u6_path_publish_42",
    object_label: "LMS publish for Grade 7 English A",
    queue_label: "Sync failure and compensation",
    severity: "REVIEW",
    risk_level: "LOW",
    owner_user_id: "usr_admin_noah",
    owner_label: "Noah Patel",
    deadline_at: "2026-06-26T14:00:00.000Z",
    status: "OPEN",
    reason_codes: ["LMS_DEAD_LETTER", "RETRY_EXHAUSTED"],
    teacher_readable_reason: "AdaptLearn path remains governed; LMS publish needs retry or compensation.",
    source_version: "sync attempt 5",
    trace_link: "/foundation/audit/traces/trc_lms_dead_letter",
  },
  {
    review_case_id: "rc_submission_media_review",
    object_type: "StudentSubmission",
    object_id: "sub_oral_retell_104",
    object_label: "Student oral retelling submission",
    queue_label: "Student submission needing review",
    severity: "REVIEW",
    risk_level: "MEDIUM",
    owner_user_id: "usr_teacher_lina",
    owner_label: "Lina Chen",
    deadline_at: "2026-06-26T12:00:00.000Z",
    status: "ASSIGNED",
    reason_codes: ["LOW_TRANSCRIPT_CONFIDENCE"],
    teacher_readable_reason: "Transcript confidence is low; keep student feedback in review-pending state.",
    source_version: "submission v1",
  },
];

export const learningPaths: LearningPathReviewRecord[] = [
  {
    pathId: "pth_xiaoming_u6_v3",
    learnerId: "learner_xiaoming",
    learnerLabel: "Xiaoming Zhang",
    classId: "class_g7_a",
    classLabel: "Grade 7 English A",
    unitId: "U6",
    unitTitle: unit6.title,
    goal: "Build vocabulary, process sequencing, and explanation quality for plant processes.",
    status: "TEACHER_REVIEW",
    version: 3,
    currentVersion: 3,
    lintStatus: "INFO",
    verifierStatus: "PASS",
    ruleVersion: "rules-u6-teacher-default-v4",
    verifierVersion: "path-verifier-2026.06",
    reviewCaseIds: ["rc_path_sunlight_review"],
    lmsSyncId: "sync_u6_path_publish_42",
    teacherAuditExplanation: {
      teacherText:
        "The path emphasizes photosynthesis inputs/outputs and delays oral retelling until vocabulary evidence is stronger.",
      studentText: "You will review plant words, sort photosynthesis ideas, then explain how plants use sunlight.",
      ruleRefs: ["repeat-vocabulary-before-speaking", "max-35-minutes-per-path"],
      excludedTaskRefs: ["UI22", "UI31"],
    },
    ruleEvaluation: {
      selectedTaskIds: [...displayTaskIds],
      excluded: [
        { taskId: "UI22", reasonCode: "TOO_DIFFICULT_FOR_CURRENT_EVIDENCE" },
        { taskId: "UI31", reasonCode: "REQUIRES_UNAPPROVED_ANNOTATION" },
      ],
      componentScores: {
        evidenceFit: 0.82,
        difficultyFit: 0.74,
        novelty: 0.61,
      },
    },
    tasks: displayTaskIds.map((taskId) => {
      const task = getTask(taskId);
      return {
        taskId,
        title: task.title,
        module: task.module,
        taskType: task.task_type,
        minutes: task.estimated_minutes,
        bloom: task.bloom,
        thinking: task.thinking_primary,
        nodeLabels: task.node_labels,
        taskState: "APPROVED",
        annotationState: taskId === "UI17" ? "BLOCKED" : "APPROVED",
        studentReason: taskId === "UI17" ? "Speak with evidence after teacher review" : "Practice a needed Unit 6 skill",
      };
    }),
  },
  {
    pathId: "pth_mina_u6_v1",
    learnerId: "learner_mina",
    learnerLabel: "Mina Park",
    classId: "class_g7_a",
    classLabel: "Grade 7 English A",
    unitId: "U6",
    unitTitle: unit6.title,
    goal: "Strengthen photosynthesis input/output classification and evidence-backed explanation.",
    status: "PUBLISHED",
    version: 1,
    currentVersion: 1,
    lintStatus: "INFO",
    verifierStatus: "PASS",
    ruleVersion: "rules-u6-teacher-default-v4",
    verifierVersion: "path-verifier-2026.06",
    reviewCaseIds: [],
    lmsSyncId: "sync_u6_path_publish_39",
    teacherAuditExplanation: {
      teacherText: "Low-risk path with approved objective tasks only.",
      studentText: "You will practice sorting plant process ideas and using evidence in an explanation.",
      ruleRefs: ["objective-first-low-risk"],
      excludedTaskRefs: [],
    },
    ruleEvaluation: {
      selectedTaskIds: ["UI01", "UI02", "UI03", "UI04"],
      excluded: [],
      componentScores: {
        evidenceFit: 0.88,
        difficultyFit: 0.81,
        novelty: 0.57,
      },
    },
    tasks: ["UI01", "UI02", "UI03", "UI04"].map((taskId) => {
      const task = getTask(taskId);
      return {
        taskId,
        title: task.title,
        module: task.module,
        taskType: task.task_type,
        minutes: task.estimated_minutes,
        bloom: task.bloom,
        thinking: task.thinking_primary,
        nodeLabels: task.node_labels,
        taskState: "APPROVED",
        annotationState: "APPROVED",
        studentReason: "Practice a needed Unit 6 skill",
      };
    }),
  },
];

export const decisionTraces: DecisionTrace[] = [
  createDecisionTrace({
    actorUserId: "usr_teacher_lina",
    actorLabel: "Lina Chen",
    action: "REPLAN",
    objectId: "pth_xiaoming_u6_v2",
    beforeSnapshotRef: "snapshot://paths/pth_xiaoming_u6_v2",
    afterSnapshotRef: "snapshot://paths/pth_xiaoming_u6_v3",
    reason: "Speaking task should come after vocabulary review and teacher confirmation.",
    ruleVersion: "rules-u6-teacher-default-v4",
    lintVersion: "path-lint-2026.06",
    verifierVersion: "path-verifier-2026.06",
    nowIso: "2026-06-26T01:20:00.000Z",
  }),
  createDecisionTrace({
    actorUserId: "usr_researcher_hao",
    actorLabel: "Hao Lin",
    action: "MODIFY",
    objectId: "ann_UI02_v4",
    beforeSnapshotRef: "snapshot://annotations/ann_UI02_v3",
    afterSnapshotRef: "snapshot://annotations/ann_UI02_v4",
    reason: "Aligned the thinking label with classification rather than process sequencing.",
    lintVersion: "annotation-lint-2026.06",
    nowIso: "2026-06-25T11:45:00.000Z",
  }),
];

const publishGuard = canPublishLearningPath({
  scope: activeScope,
  path: learningPaths[0],
  reviewCases,
});

export const safeProjectionPreview = buildStudentSafeProjection(learningPaths[0], reviewCases);

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "Assigned class scope",
    value: "Grade 7 English A",
    detail: "32 students; Unit 6 active",
    tone: "info",
    href: "/admin/classes/class_g7_a/diagnosis",
  },
  {
    label: "Path reviews",
    value: "8",
    detail: publishGuard.allowed ? "Ready for teacher decisions" : "3 blocked by ReviewCase",
    tone: publishGuard.allowed ? "success" : "warning",
    href: "/admin/paths/pth_xiaoming_u6_v3/review",
  },
  {
    label: "Review queue",
    value: "15",
    detail: "5 assigned to you; 2 high-risk",
    tone: "danger",
    href: "/admin/review-cases",
  },
  {
    label: "LMS sync",
    value: "2",
    detail: "Dead-letter items need retry or compensation",
    tone: "blocked",
    href: "/admin/monitoring/lms",
  },
];

export const workQueueRows = reviewCases.map((reviewCase) => ({
  queue: reviewCase.queue_label,
  item: reviewCase.object_label,
  severity: reviewCase.severity,
  status: reviewCase.status,
  owner: reviewCase.owner_label ?? "Unassigned",
  due: reviewCase.deadline_at ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(reviewCase.deadline_at)) : "No SLA",
  href: `/admin/review-cases/${reviewCase.review_case_id}`,
  meta: reviewCase.review_case_id,
}));

export const contentRows = [
  {
    title: "The Power of Plants source packet",
    module: "Unit 6 overview",
    status: "PUBLISHED_LOCKED",
    source: "Textbook packet, pages 42-47",
    copyright: "Cleared for classroom use",
    version: "v1",
    href: "/admin/content/cnt_u6_packet_v1",
    meta: "cnt_u6_packet_v1",
  },
  {
    title: "Daylight and plant growth reading",
    module: "Photosynthesis",
    status: "PRE_LINT",
    source: "RAG source request pending",
    copyright: "Needs fix",
    version: "v2",
    href: "/admin/content/cnt_u6_daylight_v2",
    meta: "cnt_u6_daylight_v2",
  },
  {
    title: "Oral retelling rubric notes",
    module: "Speaking",
    status: "BLOCKED",
    source: "Teacher authored",
    copyright: "Internal",
    version: "v3",
    href: "/admin/content/cnt_u6_speaking_rubric_v3",
    meta: "cnt_u6_speaking_rubric_v3",
  },
];

export const taxonomyRows = [
  {
    name: "Plant structure vocabulary",
    path: "English knowledge / Vocabulary cluster",
    level: "Skill cluster",
    module: "Plant vocabulary",
    tasks: 12,
    risk: "Low",
    status: "Version draft",
    href: "/admin/taxonomy/node_plant_structure_vocabulary",
    meta: "node_plant_structure_vocabulary",
  },
  {
    name: "Photosynthesis inputs and outputs",
    path: "English knowledge / Process understanding",
    level: "Teachable node",
    module: "Photosynthesis",
    tasks: 18,
    risk: "Medium",
    status: "Version draft",
    href: "/admin/taxonomy/node_photosynthesis_inputs_outputs",
    meta: "node_photosynthesis_inputs_outputs",
  },
  {
    name: "Cause and effect explanation",
    path: "Thinking quality / Evidence reasoning",
    level: "Teachable node",
    module: "Scientific explanation",
    tasks: 9,
    risk: "High",
    status: "Expert review requested",
    href: "/admin/taxonomy/node_cause_effect_explanation",
    meta: "node_cause_effect_explanation",
  },
  {
    name: "Process sequencing",
    path: "Thinking quality / Sequence reasoning",
    level: "Teachable node",
    module: "Photosynthesis",
    tasks: 14,
    risk: "Low",
    status: "Version draft",
    href: "/admin/taxonomy/node_process_sequencing",
    meta: "node_process_sequencing",
  },
  {
    name: "Oral retelling with evidence",
    path: "Language skill / Speaking",
    level: "Teachable node",
    module: "Speaking",
    tasks: 6,
    risk: "High",
    status: "Expert review requested",
    href: "/admin/taxonomy/node_oral_retelling_evidence",
    meta: "node_oral_retelling_evidence",
  },
];

export const annotationRows = displayTaskIds.map((taskId, index) => {
  const task = getTask(taskId);
  const blocked = taskId === "UI17";
  return {
    task: task.title,
    module: task.module,
    candidate: task.node_labels.join(", "),
    confidence: blocked ? "Low" : index > 3 ? "Medium" : "High",
    lint: blocked ? "BLOCK" : index === 3 ? "REVIEW" : "INFO",
    status: blocked ? "ReviewCase assigned" : index === 3 ? "Review required" : "Ready for researcher",
    href: `/admin/annotations/${taskId}:annotation`,
    meta: `${taskId}:annotation`,
  };
});

export const packageRows = [
  {
    title: "Unit 6 foundational plant process package",
    audience: "Grade 7 English",
    tasks: 24,
    lint: "PASS",
    status: "Published locked",
    href: "/admin/assembly/pkg_u6_foundation_v1",
    meta: "pkg_u6_foundation_v1",
  },
  {
    title: "Speaking and explanation extension set",
    audience: "Teacher-reviewed delivery",
    tasks: 12,
    lint: "REVIEW",
    status: "ReviewCase required",
    href: "/admin/assembly/pkg_u6_speaking_v2",
    meta: "pkg_u6_speaking_v2",
  },
];

export const diagnosisRows = [
  {
    learner: "Xiaoming Zhang",
    evidence: "Tentative evidence",
    bkt: "Growing",
    bloom: "Understand confirmed; Evaluate insufficient",
    thinking: "Sequence strong; evidence reasoning growing",
    path: "Needs teacher review",
    href: "/admin/students/learner_xiaoming/diagnosis",
    meta: "learner_xiaoming",
  },
  {
    learner: "Mina Park",
    evidence: "Sufficient evidence",
    bkt: "Strong",
    bloom: "Apply confirmed",
    thinking: "Evidence reasoning strong",
    path: "Published",
    href: "/admin/students/learner_mina/diagnosis",
    meta: "learner_mina",
  },
  {
    learner: "Jon Lee",
    evidence: "Low confidence",
    bkt: "Needs Practice",
    bloom: "Remember emerging",
    thinking: "Observation growing",
    path: "Generate path",
    href: "/admin/students/learner_jon/diagnosis",
    meta: "learner_jon",
  },
];

export const ruleRows = [
  {
    name: "Unit 6 teacher default rule profile",
    status: "Released",
    rollout: "Grade 7 English A",
    constraints: "35 min path cap; speaking after vocabulary evidence",
    href: "/admin/rules/rules-u6-teacher-default-v4",
    meta: "rules-u6-teacher-default-v4",
  },
  {
    name: "Low-risk objective auto-delivery sampling",
    status: "Draft",
    rollout: "Not enabled",
    constraints: "Requires explicit teacher enablement",
    href: "/admin/rules/rules-u6-low-risk-auto-v1",
    meta: "rules-u6-low-risk-auto-v1",
  },
];

export const researchRows = [
  {
    claim: "Spacing vocabulary before oral retelling improves retrieval quality.",
    source: "Teacher rules source packet",
    status: "Expert approved",
    citation: "citation:src_teacher_rules_12",
    href: "/admin/research/claim_spacing_before_speaking",
    meta: "claim_spacing_before_speaking",
  },
  {
    claim: "Student explanation tasks should separate evidence selection from reasoning quality.",
    source: "Research evidence draft",
    status: "Citation lint review",
    citation: "citation:src_evidence_09",
    href: "/admin/research/claim_evidence_reasoning_split",
    meta: "claim_evidence_reasoning_split",
  },
];

export const monitoringRows = [
  {
    workflow: "Path publication LMS sync",
    status: "DEAD_LETTER",
    object: "Grade 7 English A Unit 6 path publish",
    retry: "Retry waiting after admin reason",
    trace: "/foundation/audit/traces/trc_lms_dead_letter",
    meta: "sync_u6_path_publish_42",
  },
  {
    workflow: "Content annotation",
    status: "SUCCEEDED",
    object: "Plant vocabulary task annotations",
    retry: "No retry needed",
    trace: "/foundation/audit/traces/trc_annotation_success",
    meta: "agent_annotation_214",
  },
  {
    workflow: "Diagnosis summarizer",
    status: "REVIEW",
    object: "Xiaoming Zhang Unit 6 evidence refresh",
    retry: "Teacher ReviewCase created",
    trace: "/foundation/audit/traces/trc_diagnosis_review",
    meta: "agent_diagnosis_088",
  },
];

export function getToneForStatus(status: string): StatusTone {
  if (["PUBLISHED", "PUBLISHED_LOCKED", "PASS", "SYNCED", "SUCCEEDED", "Released", "Expert approved"].includes(status)) {
    return "success";
  }

  if (["REVIEW", "REVIEW_REQUIRED", "IN_REVIEW", "ASSIGNED", "NEEDS_FIX", "Review required", "ReviewCase required"].includes(status)) {
    return "warning";
  }

  if (["BLOCK", "BLOCKED", "BLOCKED_FINAL", "DEAD_LETTER"].includes(status)) {
    return "blocked";
  }

  return "neutral";
}
