export const ADMIN_SCREEN_IDS = [
  "ADM-AUTH-001",
  "ADM-DASH-001",
  "ADM-CONTENT-001",
  "ADM-ANNOT-001",
  "ADM-ASSEMBLY-001",
  "ADM-DIAG-001",
  "ADM-PATH-001",
  "ADM-QUALITY-001",
  "ADM-RULES-001",
  "ADM-RESEARCH-001",
  "ADM-MONITOR-001",
] as const;

export const STUDENT_SCREEN_IDS = [
  "STU-HOME-001",
  "STU-PATH-001",
  "STU-TASK-001",
  "STU-FEEDBACK-001",
  "STU-GROWTH-001",
] as const;

export const SCREEN_IDS = [...ADMIN_SCREEN_IDS, ...STUDENT_SCREEN_IDS] as const;

export type AdminScreenId = (typeof ADMIN_SCREEN_IDS)[number];
export type StudentScreenId = (typeof STUDENT_SCREEN_IDS)[number];
export type ScreenId = (typeof SCREEN_IDS)[number];

export const SCREEN_ROUTES: Record<ScreenId, string> = {
  "ADM-AUTH-001": "/admin/login",
  "ADM-DASH-001": "/admin",
  "ADM-CONTENT-001": "/admin/content",
  "ADM-ANNOT-001": "/admin/annotations",
  "ADM-ASSEMBLY-001": "/admin/assembly",
  "ADM-DIAG-001": "/admin/diagnosis",
  "ADM-PATH-001": "/admin/paths/:pathId/review",
  "ADM-QUALITY-001": "/admin/review-cases",
  "ADM-RULES-001": "/admin/rules",
  "ADM-RESEARCH-001": "/admin/research",
  "ADM-MONITOR-001": "/admin/monitoring",
  "STU-HOME-001": "/student",
  "STU-PATH-001": "/student/path/:pathId",
  "STU-TASK-001": "/student/tasks/:taskId",
  "STU-FEEDBACK-001": "/student/tasks/:taskId/feedback",
  "STU-GROWTH-001": "/student/growth",
};

export const SCREEN_PRIORITIES: Record<ScreenId, "P0" | "P0-min" | "P1"> = {
  "ADM-AUTH-001": "P0",
  "ADM-DASH-001": "P0",
  "ADM-CONTENT-001": "P0",
  "ADM-ANNOT-001": "P0",
  "ADM-ASSEMBLY-001": "P0",
  "ADM-DIAG-001": "P0",
  "ADM-PATH-001": "P0",
  "ADM-QUALITY-001": "P0-min",
  "ADM-RULES-001": "P1",
  "ADM-RESEARCH-001": "P1",
  "ADM-MONITOR-001": "P1",
  "STU-HOME-001": "P0",
  "STU-PATH-001": "P0",
  "STU-TASK-001": "P0",
  "STU-FEEDBACK-001": "P0",
  "STU-GROWTH-001": "P1",
};
