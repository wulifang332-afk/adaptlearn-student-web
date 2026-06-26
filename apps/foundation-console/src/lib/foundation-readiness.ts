import {
  foundationApi,
  getFoundationApiBaseUrl,
  type FoundationApiMeta,
  type FoundationApiPage,
  type FoundationEnvironmentCheck,
  type FoundationGeneratorDryRun,
  type FoundationRegistryResponse,
  type FoundationRegistryResource,
  type FoundationRlsTest,
} from "./foundation-api";
import {
  foundationPages,
  studentForbiddenFieldTokens,
  studentSafeProjectionPreview,
  type FoundationPageId,
  type FoundationStatus,
} from "./foundation";

const READINESS_TIMEOUT_MS = 1_500;

export type FoundationReadinessSource = "api" | "local-fallback";

export type FoundationSafePreviewField = {
  label: string;
  value: string;
};

export type FoundationReadinessSnapshot = {
  source: FoundationReadinessSource;
  status: FoundationStatus;
  safeMessage: string;
  fallbackReason?: string;
  apiBaseUrl: string;
  traceId: string;
  requestId?: string;
  auditLogId?: string;
  pageCount: number;
  pages: FoundationApiPage[];
  boundaries: string[];
  registries: FoundationRegistryResponse;
  environment: FoundationApiMeta & {
    checks: FoundationEnvironmentCheck[];
    secretValuesReturned: false;
    browserServiceRoleExposure: "PASS";
  };
  rls: FoundationApiMeta & {
    runner: string;
    tests: FoundationRlsTest[];
    safeDiagnosticsOnly: true;
  };
  studentSafePreview: FoundationApiMeta & {
    projection: "student_learning_path_view";
    fields: FoundationSafePreviewField[];
    blockedFieldTokens: string[];
  };
  generatorDryRun: FoundationGeneratorDryRun;
};

export type FoundationReadinessOptions = {
  forceLocal?: boolean;
  timeoutMs?: number;
};

type FoundationStudentSafePreviewApi = FoundationApiMeta & {
  projection: "student_learning_path_view";
  safeOutput: Record<string, string | number>;
  blockedFieldTokens: string[];
};

export async function getFoundationReadinessSnapshot(
  options: FoundationReadinessOptions = {},
): Promise<FoundationReadinessSnapshot> {
  if (options.forceLocal || process.env.FOUNDATION_CONSOLE_READINESS_SOURCE === "local") {
    return buildLocalFoundationReadinessSnapshot("Local readiness source forced by environment or test option.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? READINESS_TIMEOUT_MS);

  try {
    const [overview, environment, registries, rls, studentSafePreview, generatorDryRun] = await Promise.all([
      foundationApi.getOverview({ signal: controller.signal }),
      foundationApi.getEnvironmentChecks({ signal: controller.signal }),
      foundationApi.getRegistries({ signal: controller.signal }),
      foundationApi.getRlsTests({ signal: controller.signal }),
      foundationApi.getStudentSafePreview({ signal: controller.signal }),
      foundationApi.getGeneratorDryRun({ signal: controller.signal }),
    ]);

    return {
      source: "api",
      status: "PASS",
      safeMessage: "FastAPI readiness endpoints returned safe mock data for the console.",
      apiBaseUrl: getFoundationApiBaseUrl(),
      traceId: overview.traceId,
      requestId: overview.requestId,
      auditLogId: overview.auditLogId,
      pageCount: overview.pageCount,
      pages: overview.pages,
      boundaries: overview.boundaries,
      registries,
      environment,
      rls,
      studentSafePreview: {
        ...studentSafePreview,
        fields: toSafePreviewFields(studentSafePreview.safeOutput),
      },
      generatorDryRun,
    };
  } catch (error) {
    return buildLocalFoundationReadinessSnapshot(toSafeFallbackReason(error));
  } finally {
    clearTimeout(timeout);
  }
}

export function buildLocalFoundationReadinessSnapshot(fallbackReason = "FastAPI readiness API is unavailable."): FoundationReadinessSnapshot {
  const pages = foundationPages.map((page) => ({
    pageId: page.id,
    route: page.href,
    label: page.label,
    purpose: page.purpose,
    category: getLocalPageCategory(page.id),
  }));

  return {
    source: "local-fallback",
    status: "MOCK",
    safeMessage: "Rendering typed local mock registry; no external service or secret is required.",
    fallbackReason,
    apiBaseUrl: getFoundationApiBaseUrl(),
    traceId: "trc_foundation_local_fallback_001",
    requestId: "req_foundation_local_fallback_001",
    auditLogId: "audit_log_foundation_local_fallback_001",
    pageCount: foundationPages.length,
    pages,
    boundaries: [
      "Foundation cannot approve teacher/expert business decisions.",
      "Student surfaces read only safe projection fields.",
      "Service-role behavior stays server-side in trusted API or worker paths.",
    ],
    registries: buildLocalFoundationRegistries(),
    environment: {
      mock: true,
      traceId: "trc_environment_local_fallback_001",
      requestId: "req_environment_local_fallback_001",
      auditLogId: "audit_log_environment_local_fallback_001",
      secretValuesReturned: false,
      browserServiceRoleExposure: "PASS",
      checks: [
        localEnvironmentCheck("env_next_public_supabase_url", "NEXT_PUBLIC_SUPABASE_URL", "PASS", true, false),
        localEnvironmentCheck("env_supabase_secret_key", "SUPABASE_SECRET_KEY", "WARN", false, true),
        localEnvironmentCheck("env_openai_api_key", "OPENAI_API_KEY", "NOT_CONFIGURED", false, true),
        localEnvironmentCheck("env_redis_url", "REDIS_URL", "NOT_CONFIGURED", false, true),
        localEnvironmentCheck("env_lms_client_secret", "LMS_CLIENT_SECRET", "MOCK", false, true),
      ],
    },
    rls: {
      mock: true,
      traceId: "trc_rls_local_fallback_001",
      requestId: "req_rls_local_fallback_001",
      auditLogId: "audit_log_rls_local_fallback_001",
      runner: "local_mock_rls_policy_runner",
      safeDiagnosticsOnly: true,
      tests: [
        localRlsTest("rls_student_safe_projection", "student", "Own safe projection read", "PASS", true),
        localRlsTest("rls_teacher_assigned_class", "teacher", "Assigned class scope read", "PASS", true),
        localRlsTest("rls_teacher_unassigned_class", "teacher", "Unassigned class scope read", "PASS", false),
        localRlsTest("rls_research_content_scope", "curriculum_researcher", "Content metadata read", "PASS", true),
        localRlsTest("rls_expert_review_scope", "expert", "Assigned high-risk case read", "PASS", true),
        localRlsTest("rls_browser_service_role", "browser", "Service-role-only action from browser", "PASS", false),
        localRlsTest("rls_service_job_audited", "service_job", "Trusted worker action with trace and job id", "WARN", true),
      ],
    },
    studentSafePreview: {
      mock: true,
      traceId: studentSafeProjectionPreview.traceId,
      requestId: "req_student_safe_local_fallback_001",
      auditLogId: "audit_log_student_safe_local_fallback_001",
      projection: "student_learning_path_view",
      fields: studentSafeProjectionPreview.fields.map((field) => ({
        label: field.label,
        value: String(field.value),
      })),
      blockedFieldTokens: [...studentForbiddenFieldTokens],
    },
    generatorDryRun: buildLocalGeneratorDryRun(),
  };
}

const localRegistryPageIds: Array<{ registryId: string; pageId: FoundationPageId; label: string; category: string }> = [
  { registryId: "organization", pageId: "organization", label: "Organization / tenant registry", category: "Platform Base" },
  { registryId: "identity", pageId: "users", label: "Identity / role / scope registry", category: "Platform Base" },
  { registryId: "database", pageId: "database", label: "Supabase / schema registry", category: "Platform Base" },
  { registryId: "storage", pageId: "storage", label: "Storage bucket registry", category: "Platform Base" },
  { registryId: "rag", pageId: "rag-sources", label: "RAG source / vector registry", category: "RAG, Agents, Tools" },
  { registryId: "agents", pageId: "agent-workflows", label: "Agent workflow registry", category: "RAG, Agents, Tools" },
  { registryId: "tools", pageId: "tools", label: "Tool / connector registry", category: "RAG, Agents, Tools" },
  { registryId: "jobs", pageId: "jobs", label: "Queue / job registry", category: "RAG, Agents, Tools" },
  { registryId: "lms", pageId: "lms", label: "LMS connector registry", category: "RAG, Agents, Tools" },
  { registryId: "audit", pageId: "audit", label: "Audit / trace registry", category: "Governance" },
  { registryId: "environment", pageId: "environment", label: "Environment / secret binding registry", category: "Governance" },
  { registryId: "health", pageId: "health", label: "System health registry", category: "Governance" },
  { registryId: "generator", pageId: "generator", label: "Generated CRUD governance registry", category: "Governance" },
];

function buildLocalFoundationRegistries(): FoundationRegistryResponse {
  const sections: FoundationRegistryResponse["sections"] = localRegistryPageIds.map(({ registryId, pageId, label, category }) => {
    const page = foundationPages.find((item) => item.id === pageId);
    const resources: FoundationRegistryResource[] = (page?.rows ?? []).map((row) => ({
      resourceId: row.id,
      label: row.label,
      kind: "local_registry_row",
      status: row.status,
      owner: row.owner,
      safeSummary: row.summary,
      visibleTo: "foundation",
      traceId: row.traceId,
      auditLogId: row.auditLogId,
      queueJobId: row.queueJobId,
      agentRunId: row.agentRunId,
      toolCallId: row.toolCallId,
      mock: true,
    }));

    return {
      registryId,
      label,
      category,
      status: page?.checks.some((check) => check.status === "NOT_CONFIGURED")
        ? "WARN"
        : page?.metrics[0]?.tone === "mock"
          ? "MOCK"
          : "PASS",
      owner: resources[0]?.owner ?? "Platform engineer",
      safeMessage: page?.purpose ?? "Local typed foundation registry fallback.",
      traceId: page?.primaryTraceId ?? `trc_local_registry_${registryId}`,
      resources,
    };
  });
  const resources = sections.flatMap((section) => section.resources);

  return {
    mock: true,
    traceId: "trc_registries_local_fallback_001",
    requestId: "req_registries_local_fallback_001",
    auditLogId: "audit_log_registries_local_fallback_001",
    sections,
    summary: {
      sectionCount: sections.length,
      resourceCount: resources.length,
      passCount: countRegistryStatus(resources, "PASS"),
      warnCount: countRegistryStatus(resources, "WARN"),
      mockCount: countRegistryStatus(resources, "MOCK"),
      notConfiguredCount: countRegistryStatus(resources, "NOT_CONFIGURED"),
      blockedCount: countRegistryStatus(resources, "BLOCKED"),
    },
    secretValuesReturned: false,
    rawStudentDataReturned: false,
    safeMessage: "Local fallback mirrors API registry shape without returning secret values or raw student data.",
  };
}

function countRegistryStatus(resources: FoundationRegistryResource[], status: FoundationStatus) {
  return resources.filter((resource) => resource.status === status).length;
}

function localEnvironmentCheck(
  checkId: string,
  name: string,
  status: FoundationStatus,
  frontendSafe: boolean,
  serverOnly: boolean,
): FoundationEnvironmentCheck {
  return {
    checkId,
    name,
    status,
    safeMessage: serverOnly
      ? "Server-only binding name is listed; no secret value is returned to the browser."
      : "Browser-safe configuration name is listed without external probing.",
    frontendSafe,
    serverOnly,
    valueReturned: false,
    mock: true,
  };
}

function localRlsTest(
  testId: string,
  actorRole: string,
  scenario: string,
  status: FoundationStatus,
  allowed: boolean,
): FoundationRlsTest {
  return {
    testId,
    actorRole,
    scenario,
    status,
    allowed,
    safeMessage: allowed
      ? "Allowed in mock runner with scoped, audited access."
      : "Denied in mock runner without exposing object existence or raw payloads.",
    traceId: `trc_${testId}`,
    rawPayloadReturned: false,
  };
}

function buildLocalGeneratorDryRun(): FoundationGeneratorDryRun {
  const candidates: FoundationGeneratorDryRun["candidates"] = [
    localGeneratorCandidate(
      "crud_system_settings",
      "supabase.public.system_settings",
      "foundation-console",
      "LOW",
      "GENERATABLE",
      true,
      "Platform settings metadata list/detail scaffold with trace_id and audit reason fields.",
      [
        "Add typed table columns for key, value_type, safe_value_preview, updated_at, trace_id.",
        "Add read-only detail metadata and guarded edit form skeleton for later review.",
      ],
      [
        "apps/foundation-console/src/generated/system-settings.table.ts",
        "apps/api/app/generated/system_settings_dto.py",
      ],
    ),
    localGeneratorCandidate(
      "crud_environment_checks",
      "supabase.public.environment_checks",
      "foundation-console",
      "LOW",
      "GENERATABLE",
      true,
      "Environment readiness table using binding names and status only; secret values remain excluded.",
      [
        "Add columns for check_id, env_name, status, server_only, value_returned=false, trace_id.",
        "Generate filters for status and server_only without exposing raw environment values.",
      ],
      [
        "apps/foundation-console/src/generated/environment-checks.table.ts",
        "apps/api/app/generated/environment_check_dto.py",
      ],
    ),
    localGeneratorCandidate(
      "crud_schema_versions",
      "supabase.public.schema_versions",
      "foundation-console",
      "LOW",
      "GENERATABLE",
      true,
      "Schema version history and compatibility metadata; no business-object mutation.",
      [
        "Add schema version list columns for version, source, status, applied_at, checksum, notes.",
        "Generate read-only compatibility detail panel with audit metadata.",
      ],
      [
        "apps/foundation-console/src/generated/schema-versions.table.ts",
        "apps/api/app/generated/schema_version_dto.py",
      ],
    ),
    localGeneratorCandidate(
      "crud_rag_source_metadata",
      "supabase.public.rag_documents",
      "foundation-console",
      "MEDIUM",
      "REVIEW_REQUIRED",
      false,
      "Non-sensitive source metadata can be scaffolded only after retention and permission review.",
      [
        "Preview source metadata columns only: source_type, version, permission_class, retention_class, trace_id.",
        "Block parser, chunk, embedding, and raw source preview generation in dry-run mode.",
      ],
      ["apps/foundation-console/src/generated/rag-source-metadata.preview.ts"],
    ),
    localGeneratorCandidate(
      "blocked_learner_state_crud",
      "supabase.public.learner_profiles",
      "admin-web",
      "BLOCKED",
      "BLOCKED",
      false,
      "Learner state updates stay owned by diagnosis jobs and governed teacher workflows.",
      ["No CRUD scaffold generated.", "Use hand-written governed workflow screens and safe projections instead."],
      [],
    ),
    localGeneratorCandidate(
      "blocked_student_component_generation",
      "apps/web/src/app/student",
      "student-web",
      "BLOCKED",
      "BLOCKED",
      false,
      "Student-facing components must pass UX, safety, and projection review and are never fully autogenerated.",
      ["No Student Web component scaffold generated.", "Only safe DTO metadata may be referenced after human review."],
      [],
    ),
  ];

  return {
    mock: true,
    traceId: "trc_generator_local_fallback_001",
    requestId: "req_generator_local_fallback_001",
    auditLogId: "audit_log_generator_local_fallback_001",
    mode: "dry_run",
    dryRunId: "dryrun_generated_crud_local_fallback_001",
    crudSpecId: "generated_crud_spec_local_fallback_001",
    status: "REVIEW_REQUIRED",
    writeApplied: false,
    fileWritesApplied: false,
    databaseWritesApplied: false,
    requiresHumanReview: true,
    sourceKinds: ["supabase_schema", "fastapi_openapi", "zod_schema", "approved_metadata"],
    guardrails: {
      noSecretsInGeneratedCode: true,
      noServiceRoleInBrowser: true,
      noRawStudentData: true,
      noStudentFacingAutogeneration: true,
      teacherExpertDecisionBoundary: true,
      rlsAndStoragePolicyRequireManualReview: true,
    },
    summary: {
      candidateCount: candidates.length,
      generatableCount: candidates.filter((candidate) => candidate.status === "GENERATABLE").length,
      reviewRequiredCount: candidates.filter((candidate) => candidate.reviewRequired).length,
      blockedCount: candidates.filter((candidate) => candidate.status === "BLOCKED").length,
    },
    candidates,
    safeWarnings: [
      "Dry-run preview only; no generated files, migrations, policies, or database rows are written.",
      "Low-risk metadata candidates still require reviewer approval before use.",
      "Student-facing components and governed business objects are blocked from full autogeneration.",
    ],
  };
}

function localGeneratorCandidate(
  candidateId: string,
  sourceSchemaRef: string,
  targetSurface: string,
  riskLevel: FoundationGeneratorDryRun["candidates"][number]["riskLevel"],
  status: FoundationGeneratorDryRun["candidates"][number]["status"],
  allowed: boolean,
  safeSummary: string,
  diffSummary: string[],
  artifactPaths: string[],
): FoundationGeneratorDryRun["candidates"][number] {
  return {
    candidateId,
    sourceSchemaRef,
    targetSurface,
    riskLevel,
    status,
    allowed,
    reviewRequired: true,
    safeSummary,
    diffSummary,
    artifactPaths,
    traceId: `trc_generator_${candidateId}`,
  };
}

function toSafePreviewFields(safeOutput: FoundationStudentSafePreviewApi["safeOutput"]): FoundationSafePreviewField[] {
  return Object.entries(safeOutput).map(([label, value]) => ({
    label,
    value: String(value),
  }));
}

function getLocalPageCategory(pageId: string) {
  if (["overview", "organization", "users", "database", "rls", "storage"].includes(pageId)) {
    return "Platform Base";
  }
  if (["rag-sources", "rag-indexes", "agent-workflows", "tools", "jobs", "lms"].includes(pageId)) {
    return "RAG, Agents, Tools";
  }
  return "Governance";
}

function toSafeFallbackReason(error: unknown) {
  if (error instanceof Error && error.name === "AbortError") {
    return "FastAPI readiness API timed out before returning safe mock data.";
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.replace(/\s+/g, " ").slice(0, 180);
  }
  return "FastAPI readiness API is unavailable.";
}
