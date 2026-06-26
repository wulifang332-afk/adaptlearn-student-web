import type {
  AdminScope,
  DecisionTrace,
  DecisionTraceAction,
  LearningPathReviewRecord,
  LintStatus,
  PublishGuardResult,
  ReviewCase,
  ReviewSeverity,
  StudentSafeProjection,
} from "./admin-types";

export const UNRESOLVED_BLOCKING_REVIEW_STATUSES = new Set([
  "OPEN",
  "ASSIGNED",
  "IN_REVIEW",
  "NEEDS_FIX",
  "REOPENED",
  "BLOCKED_FINAL",
]);

export const BLOCKING_LINT_STATUSES = new Set<LintStatus>(["REVIEW", "BLOCK"]);

const ACTIONS_REQUIRING_REASON = new Set<DecisionTraceAction>(["MODIFY", "REJECT", "REPLAN", "OVERRIDE"]);

const forbiddenStudentProjectionKeys = [
  "component_scores",
  "componentScores",
  "teacherText",
  "teacher_text",
  "ruleRefs",
  "rule_refs",
  "excludedTaskRefs",
  "excluded_task_refs",
  "decisionTrace",
  "decision_trace",
  "decision_trace_ids",
  "review_cases",
  "reason_codes",
  "owner_user_id",
  "confidence",
  "theta",
  "standard_error",
];

export const getForbiddenStudentProjectionKeys = () => [...forbiddenStudentProjectionKeys];

export function isUnresolvedBlockingReviewCase(reviewCase: ReviewCase): boolean {
  return UNRESOLVED_BLOCKING_REVIEW_STATUSES.has(reviewCase.status);
}

export function reviewCasesForObject(reviewCases: ReviewCase[], objectId: string): ReviewCase[] {
  return reviewCases.filter((reviewCase) => reviewCase.object_id === objectId);
}

export function unresolvedCasesForObjects(reviewCases: ReviewCase[], objectIds: string[]): ReviewCase[] {
  const objectIdSet = new Set(objectIds);
  return reviewCases.filter((reviewCase) => objectIdSet.has(reviewCase.object_id) && isUnresolvedBlockingReviewCase(reviewCase));
}

export function ensureReviewCaseForLintResult(input: {
  objectType: ReviewCase["object_type"];
  objectId: string;
  objectLabel: string;
  lintStatus: LintStatus;
  existingCases: ReviewCase[];
  sourceVersion: string;
  defaultOwnerUserId?: string;
  nowIso?: string;
}): ReviewCase | null {
  if (!BLOCKING_LINT_STATUSES.has(input.lintStatus)) {
    return null;
  }

  const existing = input.existingCases.find(
    (reviewCase) => reviewCase.object_id === input.objectId && isUnresolvedBlockingReviewCase(reviewCase),
  );
  if (existing) {
    return existing;
  }

  const severity: ReviewSeverity = input.lintStatus === "BLOCK" ? "BLOCK" : "REVIEW";
  const createdAt = input.nowIso ?? new Date().toISOString();

  return {
    review_case_id: `rc_${input.objectId}_${input.lintStatus.toLowerCase()}`,
    object_type: input.objectType,
    object_id: input.objectId,
    object_label: input.objectLabel,
    queue_label: severity === "BLOCK" ? "Blocked publishing item" : "Review required",
    severity,
    risk_level: severity === "BLOCK" ? "HIGH" : "MEDIUM",
    owner_user_id: input.defaultOwnerUserId,
    deadline_at: createdAt,
    status: "OPEN",
    reason_codes: [`${input.lintStatus}_FROM_LINT`],
    teacher_readable_reason:
      severity === "BLOCK"
        ? "This item cannot continue until a reviewer clears the blocking issue."
        : "This item needs a human review before it can continue.",
    source_version: input.sourceVersion,
  };
}

export function createDecisionTrace(input: {
  actorUserId: string;
  actorLabel: string;
  action: DecisionTraceAction;
  objectId: string;
  beforeSnapshotRef: string;
  afterSnapshotRef?: string;
  reason?: string;
  ruleVersion?: string;
  lintVersion?: string;
  verifierVersion?: string;
  nowIso?: string;
}): DecisionTrace {
  const reasonRequired = ACTIONS_REQUIRING_REASON.has(input.action);
  const reason = input.reason?.trim();

  if (reasonRequired && !reason) {
    throw new Error(`${input.action} requires a non-empty reason`);
  }

  const createdAt = input.nowIso ?? new Date().toISOString();

  return {
    trace_id: `dtr_${input.objectId}_${input.action.toLowerCase()}_${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
    actor_user_id: input.actorUserId,
    actor_label: input.actorLabel,
    action: input.action,
    reason_required: reasonRequired,
    reason_text: reason,
    before_snapshot_ref: input.beforeSnapshotRef,
    after_snapshot_ref: input.afterSnapshotRef,
    rule_version: input.ruleVersion,
    lint_version: input.lintVersion,
    verifier_version: input.verifierVersion,
    created_at: createdAt,
    display_summary: `${input.actorLabel} recorded ${input.action.toLowerCase().replace("_", " ")} for ${input.objectId}.`,
  };
}

export function canPublishLearningPath(input: {
  scope: AdminScope;
  path: LearningPathReviewRecord;
  reviewCases: ReviewCase[];
}): PublishGuardResult {
  const { scope, path, reviewCases } = input;

  if (scope.role !== "teacher" || scope.classId !== path.classId) {
    return {
      allowed: false,
      code: "CLASS_SCOPE_DENIED",
      message: "Teacher must be assigned to this class before publishing this learner path.",
    };
  }

  if (path.version !== path.currentVersion) {
    return {
      allowed: false,
      code: "PATH_VERSION_STALE",
      message: "This path version is stale. Refresh before making the student-visible version.",
    };
  }

  if (path.verifierStatus !== "PASS") {
    return {
      allowed: false,
      code: "VERIFIER_NOT_PASS",
      message: "Path verifier must be PASS before publication.",
    };
  }

  if (BLOCKING_LINT_STATUSES.has(path.lintStatus)) {
    return {
      allowed: false,
      code: "LINT_BLOCKING",
      message: "Path lint is REVIEW/BLOCK, so a ReviewCase must be resolved first.",
    };
  }

  const linkedObjectIds = [
    path.pathId,
    ...path.reviewCaseIds,
    ...path.tasks.flatMap((task) => [task.taskId, `${task.taskId}:annotation`]),
  ];
  const blockingCases = unresolvedCasesForObjects(reviewCases, linkedObjectIds);
  if (blockingCases.length > 0) {
    return {
      allowed: false,
      code: "BLOCKING_REVIEW_CASE",
      message: "Unresolved ReviewCase blocks publish, recommend, and update flows.",
      reviewCaseIds: blockingCases.map((reviewCase) => reviewCase.review_case_id),
    };
  }

  const invalidTask = path.tasks.find((task) => task.taskState !== "APPROVED" || task.annotationState !== "APPROVED");
  if (invalidTask) {
    return {
      allowed: false,
      code: "TASK_VERSION_INVALID",
      message: `${invalidTask.title} is not fully approved for student delivery.`,
    };
  }

  return {
    allowed: true,
    code: "READY_TO_PUBLISH",
    message: "Path can be published and projected for the student.",
  };
}

export function canContinueSourceFlow(input: {
  objectId: string;
  action: "publish" | "recommend" | "update";
  reviewCases: ReviewCase[];
}): PublishGuardResult {
  const blockingCases = unresolvedCasesForObjects(input.reviewCases, [input.objectId]);
  if (blockingCases.length > 0) {
    return {
      allowed: false,
      code: "BLOCKING_REVIEW_CASE",
      message: `Cannot ${input.action} while REVIEW/BLOCK ReviewCase remains unresolved.`,
      reviewCaseIds: blockingCases.map((reviewCase) => reviewCase.review_case_id),
    };
  }

  return {
    allowed: true,
    code: "READY_TO_PUBLISH",
    message: `Source object can ${input.action}.`,
  };
}

export function buildStudentSafeProjection(path: LearningPathReviewRecord, reviewCases: ReviewCase[]): StudentSafeProjection {
  const blockingCases = unresolvedCasesForObjects(reviewCases, [path.pathId, ...path.reviewCaseIds]);
  const status: StudentSafeProjection["status"] =
    blockingCases.length > 0
      ? "REVIEW_PENDING"
      : path.version !== path.currentVersion
        ? "VERSION_STALE"
        : path.status === "PUBLISHED" || path.status === "IN_PROGRESS"
          ? path.status
          : "UNAVAILABLE";

  return {
    pathId: path.pathId,
    pathVersion: path.version,
    learnerLabel: path.learnerLabel,
    unitTitle: path.unitTitle,
    goal: path.goal,
    status,
    studentText: path.teacherAuditExplanation.studentText,
    safeReasonChips: Array.from(
      new Set(path.tasks.flatMap((task) => [task.bloom, task.thinking, ...task.nodeLabels.slice(0, 1)])),
    ).slice(0, 6),
    steps: path.tasks.map((task, index) => ({
      stepNo: index + 1,
      title: task.title,
      taskType: task.taskType,
      minutes: task.minutes,
      bloomLabel: task.bloom,
      thinkingLabel: task.thinking,
      nodeLabels: task.nodeLabels,
      status: index === 0 ? "AVAILABLE" : "LOCKED",
    })),
    syncBadge: status === "PUBLISHED" || status === "IN_PROGRESS" ? "Queued sync" : status === "REVIEW_PENDING" ? "Review pending" : "Unavailable",
  };
}

export function projectionContainsForbiddenKeys(projection: unknown): string[] {
  const serialized = JSON.stringify(projection);
  return forbiddenStudentProjectionKeys.filter((key) => serialized.includes(key));
}
