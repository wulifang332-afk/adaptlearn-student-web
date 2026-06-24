import type { ActorRole } from "./roles.js";

export const PERMISSION_ACTIONS = [
  "own_learning_path:read_published",
  "assigned_class:read",
  "content_version:create_edit_archive_review",
  "task_annotation:create_review_modify",
  "diagnosis:read_assigned_class",
  "learning_path:approve_modify_reject_replan",
  "teacher_override:create_with_reason",
  "review_case:handle_scoped",
  "rule_settings:configure_constraints",
  "lms_sync:view_static_status",
  "research_evidence:govern",
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const ROLE_PERMISSIONS: Record<ActorRole, readonly PermissionAction[]> = {
  student: ["own_learning_path:read_published"],
  teacher: [
    "assigned_class:read",
    "diagnosis:read_assigned_class",
    "learning_path:approve_modify_reject_replan",
    "teacher_override:create_with_reason",
    "review_case:handle_scoped",
    "rule_settings:configure_constraints",
    "lms_sync:view_static_status",
  ],
  curriculum_researcher: [
    "content_version:create_edit_archive_review",
    "task_annotation:create_review_modify",
    "review_case:handle_scoped",
    "rule_settings:configure_constraints",
    "lms_sync:view_static_status",
    "research_evidence:govern",
  ],
  expert: ["task_annotation:create_review_modify", "review_case:handle_scoped", "research_evidence:govern"],
  admin: ["review_case:handle_scoped", "rule_settings:configure_constraints", "lms_sync:view_static_status"],
  lms: [],
};

export const STUDENT_FORBIDDEN_FIELDS = [
  "internal_rule_weights",
  "teacher_audit_records",
  "review_case_details",
  "exact_rank",
] as const;

export const GUARDRAILS = {
  blockCannotPublishRecommendOrUpdate: true,
  reviewMustCreateReviewCase: true,
  teacherOverrideRequiresReasonAndDecisionTrace: true,
  studentsCanAccessOnlyOwnData: true,
  noRealLmsLlmBktIrtRecommendationOrDatabase: true,
} as const;
