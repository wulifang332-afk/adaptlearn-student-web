import { describe, expect, it } from "vitest";
import { DecisionTraceSchema, ReviewCaseSchema } from "@foundation/schemas/core";
import {
  buildStudentSafeProjection,
  canContinueSourceFlow,
  canPublishLearningPath,
  createDecisionTrace,
  ensureReviewCaseForLintResult,
  projectionContainsForbiddenKeys,
} from "./admin-workflows";
import type { AdminScope } from "./admin-types";
import { activeScope, learningPaths, reviewCases } from "./mock-admin-data";

describe("Admin Web governance workflows", () => {
  it("creates a ReviewCase when lint emits REVIEW and reuses an existing unresolved case", () => {
    const created = ensureReviewCaseForLintResult({
      objectType: "LearningPath",
      objectId: "pth_new_review",
      objectLabel: "New Unit 6 path",
      lintStatus: "REVIEW",
      existingCases: [],
      sourceVersion: "path v1",
      nowIso: "2026-06-26T00:00:00.000Z",
    });

    expect(created).not.toBeNull();
    expect(created?.severity).toBe("REVIEW");
    expect(ReviewCaseSchema.safeParse(created).success).toBe(true);

    const reused = ensureReviewCaseForLintResult({
      objectType: "LearningPath",
      objectId: reviewCases[0].object_id,
      objectLabel: reviewCases[0].object_label,
      lintStatus: "REVIEW",
      existingCases: reviewCases,
      sourceVersion: "path v3",
    });

    expect(reused?.review_case_id).toBe(reviewCases[0].review_case_id);
  });

  it("blocks path publish when teacher scope, lint, verifier, task, or ReviewCase gates fail", () => {
    const blocked = canPublishLearningPath({
      scope: activeScope,
      path: learningPaths[0],
      reviewCases,
    });

    expect(blocked.allowed).toBe(false);
    expect(blocked.code).toBe("BLOCKING_REVIEW_CASE");

    const wrongScope: AdminScope = {
      ...activeScope,
      classId: "class_unassigned",
      classLabel: "Unassigned class",
    };

    const denied = canPublishLearningPath({
      scope: wrongScope,
      path: learningPaths[1],
      reviewCases: [],
    });

    expect(denied.allowed).toBe(false);
    expect(denied.code).toBe("CLASS_SCOPE_DENIED");

    const allowed = canPublishLearningPath({
      scope: activeScope,
      path: learningPaths[1],
      reviewCases: [],
    });

    expect(allowed.allowed).toBe(true);
  });

  it("prevents BLOCK or unresolved REVIEW cases from publishing, recommending, or updating source flows", () => {
    for (const action of ["publish", "recommend", "update"] as const) {
      const result = canContinueSourceFlow({
        objectId: "UI17:annotation",
        action,
        reviewCases,
      });

      expect(result.allowed).toBe(false);
      expect(result.code).toBe("BLOCKING_REVIEW_CASE");
    }
  });

  it("requires teacher reasons for modify, reject, and replan while still recording approve traces", () => {
    expect(() =>
      createDecisionTrace({
        actorUserId: "usr_teacher_lina",
        actorLabel: "Lina Chen",
        action: "MODIFY",
        objectId: "pth_xiaoming_u6_v3",
        beforeSnapshotRef: "snapshot://before",
      }),
    ).toThrow("MODIFY requires a non-empty reason");

    const approveTrace = createDecisionTrace({
      actorUserId: "usr_teacher_lina",
      actorLabel: "Lina Chen",
      action: "APPROVE",
      objectId: "pth_mina_u6_v1",
      beforeSnapshotRef: "snapshot://paths/pth_mina_u6_v1",
      nowIso: "2026-06-26T00:00:00.000Z",
    });

    expect(approveTrace.reason_required).toBe(false);
    expect(DecisionTraceSchema.safeParse(approveTrace).success).toBe(true);

    const replanTrace = createDecisionTrace({
      actorUserId: "usr_teacher_lina",
      actorLabel: "Lina Chen",
      action: "REPLAN",
      objectId: "pth_xiaoming_u6_v3",
      beforeSnapshotRef: "snapshot://before",
      afterSnapshotRef: "snapshot://after",
      reason: "Student needs vocabulary evidence before oral retelling.",
      nowIso: "2026-06-26T00:10:00.000Z",
    });

    expect(replanTrace.reason_required).toBe(true);
    expect(DecisionTraceSchema.safeParse(replanTrace).success).toBe(true);
  });

  it("builds a student-safe projection without hidden fields", () => {
    const projection = buildStudentSafeProjection(learningPaths[0], reviewCases);

    expect(projection.status).toBe("REVIEW_PENDING");
    expect(projection.studentText).toContain("You will review plant words");
    expect(projectionContainsForbiddenKeys(projection)).toEqual([]);

    const serialized = JSON.stringify(projection);
    expect(serialized).not.toContain("componentScores");
    expect(serialized).not.toContain("teacherText");
    expect(serialized).not.toContain("decision_trace");
    expect(serialized).not.toContain("reason_codes");
    expect(serialized).not.toContain("owner_user_id");
  });
});
