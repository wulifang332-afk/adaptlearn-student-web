export type StateTone = "neutral" | "info" | "success" | "warning" | "review" | "block";

export type StatePresentation = {
  label: string;
  tone: StateTone;
  visibleToStudent: boolean;
  blocksContinuation: boolean;
};

export const REVIEW_CASE_BADGE_STATES: Record<string, StatePresentation> = {
  REVIEW: {
    label: "Review required",
    tone: "review",
    visibleToStudent: false,
    blocksContinuation: true,
  },
  BLOCK: {
    label: "Blocked",
    tone: "block",
    visibleToStudent: false,
    blocksContinuation: true,
  },
  ASSIGNED: {
    label: "Assigned",
    tone: "info",
    visibleToStudent: false,
    blocksContinuation: true,
  },
  RESOLVED: {
    label: "Resolved",
    tone: "success",
    visibleToStudent: false,
    blocksContinuation: false,
  },
};

export const PATH_STATUS_STATES: Record<string, StatePresentation> = {
  INITIATED: { label: "Generated", tone: "neutral", visibleToStudent: false, blocksContinuation: false },
  TEACHER_REVIEW: {
    label: "Teacher review",
    tone: "review",
    visibleToStudent: false,
    blocksContinuation: true,
  },
  PUBLISHED: { label: "Published", tone: "success", visibleToStudent: true, blocksContinuation: false },
  IN_PROGRESS: { label: "In progress", tone: "info", visibleToStudent: true, blocksContinuation: false },
  COMPLETED: { label: "Completed", tone: "success", visibleToStudent: true, blocksContinuation: false },
  REJECTED_CANCELLED: {
    label: "Rejected or cancelled",
    tone: "block",
    visibleToStudent: true,
    blocksContinuation: true,
  },
  BLOCKED: { label: "Blocked", tone: "block", visibleToStudent: false, blocksContinuation: true },
};

export const EVIDENCE_SUFFICIENCY_STATES: Record<string, StatePresentation> = {
  INSUFFICIENT: {
    label: "Insufficient evidence",
    tone: "warning",
    visibleToStudent: true,
    blocksContinuation: false,
  },
  EMERGING: { label: "Emerging", tone: "info", visibleToStudent: true, blocksContinuation: false },
  CONFIRMED: { label: "Confirmed", tone: "success", visibleToStudent: true, blocksContinuation: false },
  LOW_CONFIDENCE: {
    label: "Low confidence",
    tone: "warning",
    visibleToStudent: true,
    blocksContinuation: false,
  },
};

export const SYNC_STATUS_STATES: Record<string, StatePresentation> = {
  UNSYNCED: { label: "Unsynced", tone: "neutral", visibleToStudent: false, blocksContinuation: false },
  SYNCING: { label: "Syncing", tone: "info", visibleToStudent: false, blocksContinuation: false },
  FAILED: { label: "Sync failed", tone: "warning", visibleToStudent: false, blocksContinuation: false },
  RETRY_WAITING: { label: "Retry waiting", tone: "warning", visibleToStudent: false, blocksContinuation: false },
  DEAD_LETTER: { label: "Dead letter", tone: "block", visibleToStudent: false, blocksContinuation: false },
  COMPENSATED: { label: "Compensated", tone: "success", visibleToStudent: false, blocksContinuation: false },
  SYNCED: { label: "Synced", tone: "success", visibleToStudent: false, blocksContinuation: false },
};

export const MEDIA_CONTROL_STATES: Record<string, StatePresentation> = {
  LOADING: { label: "Loading", tone: "neutral", visibleToStudent: true, blocksContinuation: false },
  READY: { label: "Ready", tone: "success", visibleToStudent: true, blocksContinuation: false },
  FAILED: { label: "Failed", tone: "warning", visibleToStudent: true, blocksContinuation: false },
  CACHED: { label: "Cached", tone: "success", visibleToStudent: true, blocksContinuation: false },
  PERMISSION_REQUIRED: {
    label: "Permission required",
    tone: "warning",
    visibleToStudent: true,
    blocksContinuation: true,
  },
  RECORDING: { label: "Recording", tone: "info", visibleToStudent: true, blocksContinuation: false },
  UPLOADING: { label: "Uploading", tone: "info", visibleToStudent: true, blocksContinuation: false },
};

export const STATE_PRESENTATION_MAP = {
  reviewCase: REVIEW_CASE_BADGE_STATES,
  pathStatus: PATH_STATUS_STATES,
  evidenceSufficiency: EVIDENCE_SUFFICIENCY_STATES,
  syncStatus: SYNC_STATUS_STATES,
  mediaControl: MEDIA_CONTROL_STATES,
} as const;
