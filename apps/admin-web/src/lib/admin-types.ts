export type StaffRole = "teacher" | "curriculum_researcher" | "expert" | "admin";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger" | "blocked";

export type AdminScope = {
  organizationId: string;
  organizationName: string;
  role: StaffRole;
  roleLabel: string;
  classId?: string;
  classLabel?: string;
  reviewScope?: string;
  mockMode: true;
};

export type ReviewSeverity = "REVIEW" | "BLOCK";

export type ReviewCaseStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_REVIEW"
  | "NEEDS_FIX"
  | "APPROVED"
  | "CONDITIONALLY_APPROVED"
  | "REJECTED"
  | "BLOCKED_FINAL"
  | "RESOLVED"
  | "REOPENED";

export type CoreReviewCaseObjectType =
  | "ContentVersion"
  | "TaskAnnotation"
  | "LearningPath"
  | "StudentSubmission"
  | "MediaUpload"
  | "LmsSync";

export type AdminReviewCaseObjectType =
  | CoreReviewCaseObjectType
  | "KnowledgeNode"
  | "UnitPackage"
  | "ResearchClaim";

export type ReviewCase = {
  review_case_id: string;
  object_type: AdminReviewCaseObjectType;
  object_id: string;
  object_label: string;
  queue_label: string;
  severity: ReviewSeverity;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  owner_user_id?: string;
  owner_label?: string;
  deadline_at?: string;
  status: ReviewCaseStatus;
  reason_codes: string[];
  teacher_readable_reason: string;
  decision?: string;
  source_version: string;
  trace_link?: string;
};

export type LintStatus = "INFO" | "AUTO_FIX" | "WARN" | "REVIEW" | "BLOCK";
export type VerifierStatus = "PASS" | "ADJUST" | "REPLAN" | "REVIEW" | "BLOCK";
export type LearningPathState =
  | "INITIATED"
  | "TEACHER_REVIEW"
  | "PUBLISHED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REPLANNING"
  | "REJECTED_CANCELLED"
  | "BLOCKED";

export type TaskGovernanceState = "APPROVED" | "REVIEW_REQUIRED" | "BLOCKED";

export type PathTaskRef = {
  taskId: string;
  title: string;
  module: string;
  taskType: string;
  minutes: number;
  bloom: string;
  thinking: string;
  nodeLabels: string[];
  taskState: TaskGovernanceState;
  annotationState: TaskGovernanceState;
  studentReason: string;
};

export type LearningPathReviewRecord = {
  pathId: string;
  learnerId: string;
  learnerLabel: string;
  classId: string;
  classLabel: string;
  unitId: "U6";
  unitTitle: string;
  goal: string;
  status: LearningPathState;
  version: number;
  currentVersion: number;
  lintStatus: LintStatus;
  verifierStatus: VerifierStatus;
  ruleVersion: string;
  verifierVersion: string;
  tasks: PathTaskRef[];
  reviewCaseIds: string[];
  teacherAuditExplanation: {
    teacherText: string;
    studentText: string;
    ruleRefs: string[];
    excludedTaskRefs: string[];
  };
  ruleEvaluation: {
    selectedTaskIds: string[];
    excluded: Array<{ taskId: string; reasonCode: string }>;
    componentScores: Record<string, number>;
  };
  lmsSyncId: string;
};

export type DecisionTraceAction = "APPROVE" | "MODIFY" | "REJECT" | "REPLAN" | "OVERRIDE" | "SYSTEM_EVENT";

export type DecisionTrace = {
  trace_id: string;
  actor_user_id: string;
  actor_label: string;
  action: DecisionTraceAction;
  reason_required: boolean;
  reason_text?: string;
  before_snapshot_ref: string;
  after_snapshot_ref?: string;
  rule_version?: string;
  lint_version?: string;
  verifier_version?: string;
  created_at: string;
  display_summary: string;
};

export type PublishGuardResult =
  | {
      allowed: true;
      code: "READY_TO_PUBLISH";
      message: string;
    }
  | {
      allowed: false;
      code:
        | "CLASS_SCOPE_DENIED"
        | "PATH_VERSION_STALE"
        | "BLOCKING_REVIEW_CASE"
        | "VERIFIER_NOT_PASS"
        | "LINT_BLOCKING"
        | "TASK_VERSION_INVALID";
      message: string;
      reviewCaseIds?: string[];
    };

export type StudentSafeProjection = {
  pathId: string;
  pathVersion: number;
  learnerLabel: string;
  unitTitle: string;
  goal: string;
  status: "PUBLISHED" | "IN_PROGRESS" | "REVIEW_PENDING" | "VERSION_STALE" | "UNAVAILABLE";
  studentText: string;
  safeReasonChips: string[];
  steps: Array<{
    stepNo: number;
    title: string;
    taskType: string;
    minutes: number;
    bloomLabel: string;
    thinkingLabel: string;
    nodeLabels: string[];
    status: "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED" | "REVIEW_PENDING";
  }>;
  syncBadge: "AdaptLearn ready" | "Queued sync" | "Review pending" | "Unavailable";
};

export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
  tone: StatusTone;
  href: string;
};

export type TableColumn<T> = {
  key: keyof T | string;
  header: string;
  className?: string;
  render?: (row: T) => ReactNode;
};
import type { ReactNode } from "react";
