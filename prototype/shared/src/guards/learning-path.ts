type LearningPathDeliverabilityCandidate = {
  status: string;
  verifier_result: {
    status: string;
  };
  lint_status?: string;
  review_status?: string;
};

const DELIVERABLE_PATH_STATUSES = new Set(["PUBLISHED", "IN_PROGRESS"]);
const BLOCKING_VERIFIER_STATUSES = new Set(["REVIEW", "BLOCK", "REPLAN"]);
const BLOCKING_LINT_STATUSES = new Set(["REVIEW", "BLOCK"]);
const BLOCKING_REVIEW_STATUSES = new Set(["OPEN", "ASSIGNED", "IN_REVIEW", "NEEDS_FIX", "REOPENED", "BLOCKED_FINAL"]);

export const isLearningPathDeliverable = (path: LearningPathDeliverabilityCandidate): boolean => {
  if (!DELIVERABLE_PATH_STATUSES.has(path.status)) {
    return false;
  }

  if (path.verifier_result.status !== "PASS") {
    return false;
  }

  if (BLOCKING_VERIFIER_STATUSES.has(path.verifier_result.status)) {
    return false;
  }

  if (path.lint_status && BLOCKING_LINT_STATUSES.has(path.lint_status)) {
    return false;
  }

  if (path.review_status && BLOCKING_REVIEW_STATUSES.has(path.review_status)) {
    return false;
  }

  return true;
};
