import { afterEach, describe, expect, it, vi } from "vitest";
import { foundationPages, studentForbiddenFieldTokens } from "./foundation";
import { buildLocalFoundationReadinessSnapshot, getFoundationReadinessSnapshot } from "./foundation-readiness";

describe("foundation readiness snapshot", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds a safe local fallback without exposing forbidden student internals", () => {
    const snapshot = buildLocalFoundationReadinessSnapshot();
    const safeOutputText = snapshot.studentSafePreview.fields.map((field) => `${field.label} ${field.value}`).join(" ");

    expect(snapshot.source).toBe("local-fallback");
    expect(snapshot.pageCount).toBe(foundationPages.length);
    expect(snapshot.environment.secretValuesReturned).toBe(false);
    expect(snapshot.environment.checks.every((check) => check.valueReturned === false)).toBe(true);
    expect(snapshot.registries.secretValuesReturned).toBe(false);
    expect(snapshot.registries.rawStudentDataReturned).toBe(false);
    expect(snapshot.registries.summary.sectionCount).toBeGreaterThanOrEqual(10);
    expect(snapshot.registries.sections.some((section) => section.registryId === "storage")).toBe(true);
    expect(snapshot.registries.sections.some((section) => section.registryId === "lms")).toBe(true);
    expect(snapshot.generatorDryRun.mode).toBe("dry_run");
    expect(snapshot.generatorDryRun.writeApplied).toBe(false);
    expect(snapshot.generatorDryRun.requiresHumanReview).toBe(true);
    expect(snapshot.generatorDryRun.guardrails.noStudentFacingAutogeneration).toBe(true);
    expect(snapshot.generatorDryRun.summary.blockedCount).toBe(2);

    for (const token of studentForbiddenFieldTokens) {
      expect(safeOutputText).not.toContain(token);
    }
  });

  it("falls back to typed local data when readiness API is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connect ECONNREFUSED 127.0.0.1:8000");
      }),
    );

    const snapshot = await getFoundationReadinessSnapshot({ timeoutMs: 10 });

    expect(snapshot.source).toBe("local-fallback");
    expect(snapshot.status).toBe("MOCK");
    expect(snapshot.fallbackReason).toContain("ECONNREFUSED");
    expect(snapshot.registries.sections.length).toBeGreaterThanOrEqual(10);
    expect(snapshot.rls.safeDiagnosticsOnly).toBe(true);
    expect(snapshot.generatorDryRun.fileWritesApplied).toBe(false);
  });
});
