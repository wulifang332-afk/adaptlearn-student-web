import {
  activeScope,
  annotationRows,
  contentRows,
  dashboardMetrics,
  decisionTraces,
  diagnosisRows,
  learningPaths,
  monitoringRows,
  packageRows,
  researchRows,
  reviewCases,
  ruleRows,
  safeProjectionPreview,
  taxonomyRows,
  workQueueRows,
} from "./mock-admin-data";
import { buildStudentSafeProjection, canPublishLearningPath } from "./admin-workflows";
import type {
  AdminScope,
  DashboardMetric,
  DecisionTrace,
  LearningPathReviewRecord,
  PublishGuardResult,
  ReviewCase,
  StaffRole,
  StudentSafeProjection,
} from "./admin-types";

export type AdminTableRow = {
  href?: string;
  meta?: string;
  [key: string]: string | number | undefined;
};

export type WorkQueueRow = (typeof workQueueRows)[number];
export type DiagnosisRow = (typeof diagnosisRows)[number];
export type MonitoringRow = (typeof monitoringRows)[number];

export type AdminDashboardData = {
  scope: AdminScope;
  metrics: DashboardMetric[];
  workQueueRows: WorkQueueRow[];
  diagnosisRows: DiagnosisRow[];
  monitoringRows: MonitoringRow[];
  publishGuard: PublishGuardResult;
  decisionTraces: DecisionTrace[];
  safeProjectionPreview: StudentSafeProjection;
};

export type AdminPathReviewData = {
  scope: AdminScope;
  path: LearningPathReviewRecord;
  reviewCases: ReviewCase[];
  decisionTraces: DecisionTrace[];
  publishGuard: PublishGuardResult;
  safeProjectionPreview: StudentSafeProjection;
};

export type AdminReviewCasesData = {
  scope: AdminScope;
  items: ReviewCase[];
  rows: WorkQueueRow[];
};

type AdminItemsResponse<T extends AdminTableRow> = {
  items: T[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const ADMIN_DATA_SOURCE = process.env.NEXT_PUBLIC_ADMIN_DATA_SOURCE ?? "mock";

function adminHeaders(role: StaffRole = "teacher") {
  return {
    "content-type": "application/json",
    "x-mock-role": role,
  };
}

async function fetchAdminJson<T>(path: string, init: RequestInit = {}, role: StaffRole = "teacher"): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...adminHeaders(role),
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }
  return response.json() as Promise<T>;
}

function localDashboard(): AdminDashboardData {
  return {
    scope: activeScope,
    metrics: dashboardMetrics,
    workQueueRows,
    diagnosisRows,
    monitoringRows,
    publishGuard: canPublishLearningPath({ scope: activeScope, path: learningPaths[0], reviewCases }),
    decisionTraces,
    safeProjectionPreview,
  };
}

function localPathReview(pathId: string): AdminPathReviewData {
  const path = learningPaths.find((candidate) => candidate.pathId === pathId) ?? learningPaths[0];
  return {
    scope: activeScope,
    path,
    reviewCases,
    decisionTraces,
    publishGuard: canPublishLearningPath({ scope: activeScope, path, reviewCases }),
    safeProjectionPreview: buildStudentSafeProjection(path, reviewCases),
  };
}

function localReviewCases(): AdminReviewCasesData {
  return {
    scope: activeScope,
    items: reviewCases,
    rows: workQueueRows,
  };
}

async function getAdminItems<T extends AdminTableRow>(path: string, localRows: T[], role: StaffRole = "teacher"): Promise<T[]> {
  if (ADMIN_DATA_SOURCE !== "api") {
    return localRows;
  }

  try {
    const response = await fetchAdminJson<AdminItemsResponse<T>>(path, {}, role);
    return response.items;
  } catch {
    return localRows;
  }
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  if (ADMIN_DATA_SOURCE !== "api") {
    return localDashboard();
  }

  try {
    return await fetchAdminJson<AdminDashboardData>("/v1/admin/dashboard");
  } catch {
    return localDashboard();
  }
}

export async function getAdminPathReview(pathId: string): Promise<AdminPathReviewData> {
  if (ADMIN_DATA_SOURCE !== "api") {
    return localPathReview(pathId);
  }

  try {
    return await fetchAdminJson<AdminPathReviewData>(`/v1/admin/paths/${encodeURIComponent(pathId)}/review`);
  } catch {
    return localPathReview(pathId);
  }
}

export async function getAdminContentRows(): Promise<AdminTableRow[]> {
  return getAdminItems("/v1/admin/content", contentRows, "curriculum_researcher");
}

export async function getAdminTaxonomyRows(): Promise<AdminTableRow[]> {
  return getAdminItems("/v1/admin/taxonomy/tree", taxonomyRows, "curriculum_researcher");
}

export async function getAdminAnnotationRows(): Promise<AdminTableRow[]> {
  return getAdminItems("/v1/admin/annotations", annotationRows, "curriculum_researcher");
}

export async function getAdminPackageRows(): Promise<AdminTableRow[]> {
  return getAdminItems("/v1/admin/packages", packageRows, "curriculum_researcher");
}

export async function getAdminDiagnosisRows(classId = activeScope.classId ?? "class_g7_a"): Promise<DiagnosisRow[]> {
  return getAdminItems(`/v1/admin/classes/${encodeURIComponent(classId)}/diagnosis`, diagnosisRows, "teacher");
}

export async function getAdminReviewCases(): Promise<AdminReviewCasesData> {
  if (ADMIN_DATA_SOURCE !== "api") {
    return localReviewCases();
  }

  try {
    return await fetchAdminJson<AdminReviewCasesData>("/v1/admin/review-cases", {}, "admin");
  } catch {
    return localReviewCases();
  }
}

export async function getAdminRuleRows(): Promise<AdminTableRow[]> {
  return getAdminItems("/v1/admin/rules/profiles", ruleRows, "curriculum_researcher");
}

export async function getAdminResearchRows(): Promise<AdminTableRow[]> {
  return getAdminItems("/v1/admin/research/claims", researchRows, "curriculum_researcher");
}

export async function getAdminMonitoringRows(): Promise<MonitoringRow[]> {
  return getAdminItems("/v1/admin/monitoring/summary", monitoringRows, "admin");
}

export function getAdminApiRuntime() {
  return {
    apiBaseUrl: API_BASE_URL,
    dataSource: ADMIN_DATA_SOURCE,
  };
}
