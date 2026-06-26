import type { FoundationPageId, FoundationStatus } from "./foundation";

export function getFoundationApiBaseUrl() {
  return process.env.FOUNDATION_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
}

const foundationHeaders = {
  "content-type": "application/json",
  "x-mock-role": "admin",
};

export type FoundationApiPage = {
  pageId: FoundationPageId;
  route: string;
  label: string;
  purpose: string;
  category: string;
};

export type FoundationEnvironmentCheck = {
  checkId: string;
  name: string;
  status: FoundationStatus;
  safeMessage: string;
  frontendSafe: boolean;
  serverOnly: boolean;
  valueReturned: false;
  mock: true;
};

export type FoundationRlsTest = {
  testId: string;
  actorRole: string;
  scenario: string;
  status: FoundationStatus;
  allowed: boolean;
  safeMessage: string;
  traceId: string;
  rawPayloadReturned: false;
};

export type FoundationRegistryResource = {
  resourceId: string;
  label: string;
  kind: string;
  status: FoundationStatus;
  owner: string;
  safeSummary: string;
  visibleTo: string;
  traceId: string;
  auditLogId?: string;
  queueJobId?: string;
  agentRunId?: string;
  toolCallId?: string;
  mock: true;
};

export type FoundationRegistrySection = {
  registryId: string;
  label: string;
  category: string;
  status: FoundationStatus;
  owner: string;
  safeMessage: string;
  traceId: string;
  resources: FoundationRegistryResource[];
};

export type FoundationRegistryResponse = FoundationApiMeta & {
  sections: FoundationRegistrySection[];
  summary: {
    sectionCount: number;
    resourceCount: number;
    passCount: number;
    warnCount: number;
    mockCount: number;
    notConfiguredCount: number;
    blockedCount: number;
  };
  secretValuesReturned: false;
  rawStudentDataReturned: false;
  safeMessage: string;
};

export type FoundationGeneratorCandidate = {
  candidateId: string;
  sourceSchemaRef: string;
  targetSurface: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "BLOCKED";
  status: "GENERATABLE" | "REVIEW_REQUIRED" | "BLOCKED";
  allowed: boolean;
  reviewRequired: boolean;
  safeSummary: string;
  diffSummary: string[];
  artifactPaths: string[];
  traceId: string;
};

export type FoundationGeneratorDryRun = FoundationApiMeta & {
  mode: "dry_run";
  dryRunId: string;
  crudSpecId: string;
  status: "REVIEW_REQUIRED";
  writeApplied: false;
  fileWritesApplied: false;
  databaseWritesApplied: false;
  requiresHumanReview: true;
  sourceKinds: string[];
  guardrails: {
    noSecretsInGeneratedCode: true;
    noServiceRoleInBrowser: true;
    noRawStudentData: true;
    noStudentFacingAutogeneration: true;
    teacherExpertDecisionBoundary: true;
    rlsAndStoragePolicyRequireManualReview: true;
  };
  summary: {
    candidateCount: number;
    generatableCount: number;
    reviewRequiredCount: number;
    blockedCount: number;
  };
  candidates: FoundationGeneratorCandidate[];
  safeWarnings: string[];
};

export type FoundationApiMeta = {
  mock: true;
  traceId: string;
  requestId: string;
  auditLogId: string;
};

async function fetchFoundationJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getFoundationApiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...foundationHeaders,
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }
  return response.json() as Promise<T>;
}

export const foundationApi = {
  getOverview: (init?: RequestInit) =>
    fetchFoundationJson<
      FoundationApiMeta & {
        surface: "Foundational Console";
        routeRoot: "/foundation";
        pageCount: number;
        pages: FoundationApiPage[];
        boundaries: string[];
      }
    >("/v1/foundation/overview", init),
  getPages: (init?: RequestInit) =>
    fetchFoundationJson<FoundationApiMeta & { pages: FoundationApiPage[] }>("/v1/foundation/pages", init),
  getPage: (pageId: FoundationPageId, init?: RequestInit) =>
    fetchFoundationJson<FoundationApiMeta & FoundationApiPage>(`/v1/foundation/pages/${encodeURIComponent(pageId)}`, init),
  getEnvironmentChecks: (init?: RequestInit) =>
    fetchFoundationJson<
      FoundationApiMeta & {
        checks: FoundationEnvironmentCheck[];
        secretValuesReturned: false;
        browserServiceRoleExposure: "PASS";
      }
    >("/v1/foundation/environment/checks", init),
  getRegistries: (init?: RequestInit) =>
    fetchFoundationJson<FoundationRegistryResponse>("/v1/foundation/registries", init),
  getRegistry: (registryId: string, init?: RequestInit) =>
    fetchFoundationJson<FoundationApiMeta & FoundationRegistrySection & { secretValuesReturned: false; rawStudentDataReturned: false }>(
      `/v1/foundation/registries/${encodeURIComponent(registryId)}`,
      init,
    ),
  getRlsTests: (init?: RequestInit) =>
    fetchFoundationJson<
      FoundationApiMeta & {
        runner: "mock_rls_policy_runner";
        tests: FoundationRlsTest[];
        safeDiagnosticsOnly: true;
      }
    >("/v1/foundation/rls/tests", init),
  getStudentSafePreview: (init?: RequestInit) =>
    fetchFoundationJson<
      FoundationApiMeta & {
        projection: "student_learning_path_view";
        safeOutput: Record<string, string | number>;
        blockedFieldTokens: string[];
      }
    >("/v1/foundation/student-safe-preview", init),
  getGeneratorDryRun: (init?: RequestInit) =>
    fetchFoundationJson<FoundationGeneratorDryRun>("/v1/foundation/generator/dry-run", init),
};
