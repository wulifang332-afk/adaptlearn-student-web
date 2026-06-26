import { afterEach, describe, expect, it, vi } from "vitest";
import { foundationApi } from "./foundation-api";

describe("foundationApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses admin mock role headers for readiness endpoints", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ mock: true, pages: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await foundationApi.getPages();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/v1/foundation/pages",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({
          "content-type": "application/json",
          "x-mock-role": "admin",
        }),
      }),
    );
  });

  it("reads the generator dry-run endpoint without write-oriented headers", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            mock: true,
            mode: "dry_run",
            dryRunId: "dryrun_generated_crud_mock_001",
            crudSpecId: "generated_crud_spec_mock_001",
            status: "REVIEW_REQUIRED",
            writeApplied: false,
            fileWritesApplied: false,
            databaseWritesApplied: false,
            requiresHumanReview: true,
            sourceKinds: [],
            guardrails: {
              noSecretsInGeneratedCode: true,
              noServiceRoleInBrowser: true,
              noRawStudentData: true,
              noStudentFacingAutogeneration: true,
              teacherExpertDecisionBoundary: true,
              rlsAndStoragePolicyRequireManualReview: true,
            },
            summary: {
              candidateCount: 0,
              generatableCount: 0,
              reviewRequiredCount: 0,
              blockedCount: 0,
            },
            candidates: [],
            safeWarnings: [],
            traceId: "trc_generator",
            requestId: "req_generator",
            auditLogId: "audit_log_generator",
          }),
          { status: 200 },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const dryRun = await foundationApi.getGeneratorDryRun();

    expect(dryRun.writeApplied).toBe(false);
    expect(dryRun.requiresHumanReview).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/v1/foundation/generator/dry-run",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.not.objectContaining({
          "x-service-role": expect.any(String),
        }),
      }),
    );
  });

  it("reads the registry endpoint with safe admin mock headers", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            mock: true,
            sections: [],
            summary: {
              sectionCount: 0,
              resourceCount: 0,
              passCount: 0,
              warnCount: 0,
              mockCount: 0,
              notConfiguredCount: 0,
              blockedCount: 0,
            },
            secretValuesReturned: false,
            rawStudentDataReturned: false,
            safeMessage: "safe registry",
            traceId: "trc_registries",
            requestId: "req_registries",
            auditLogId: "audit_log_registries",
          }),
          { status: 200 },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const registries = await foundationApi.getRegistries();

    expect(registries.secretValuesReturned).toBe(false);
    expect(registries.rawStudentDataReturned).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/v1/foundation/registries",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({
          "x-mock-role": "admin",
        }),
      }),
    );
  });

  it("throws a readable error when readiness endpoint fails", async () => {
    const fetchMock = vi.fn(async () => new Response("denied", { status: 403, statusText: "Forbidden" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(foundationApi.getOverview()).rejects.toThrow("403 Forbidden: denied");
  });
});
