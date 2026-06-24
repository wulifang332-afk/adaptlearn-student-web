import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DecisionTraceSchema,
  FLOW_IDS,
  LearningPathSchema,
  MOCK_SIMULATION_NOTICE,
  SCREEN_IDS,
  createInMemoryMockApi,
  isLearningPathDeliverable,
  unit6Fixture,
  unit6FixtureCounts,
} from "../src/index.js";

const clonedFixtureWithVerifierStatus = (status: "REVIEW" | "BLOCK" | "REPLAN") => {
  const fixture = structuredClone(unit6Fixture);
  const path = fixture.learning_paths[0];
  assert.ok(path);
  fixture.learning_paths[0] = {
    ...path,
    status: "PUBLISHED",
    verifier_result: {
      ...path.verifier_result,
      status,
    },
  };
  return fixture;
};

const baseDecisionTrace = {
  trace_id: "trace_test_reason",
  actor_user_id: "usr_teacher_01",
  action: "APPROVE",
  reason_required: false,
  before_snapshot_ref: "learning_path:PTH01:v1",
  created_at: "2026-06-23T04:30:00.000Z",
} as const;

describe("shared foundation contracts", () => {
  it("keeps canonical screen and flow IDs", () => {
    assert.equal(SCREEN_IDS.length, 16);
    assert.equal(new Set(SCREEN_IDS).size, 16);
    assert.equal(SCREEN_IDS.filter((screenId) => screenId.startsWith("ADM-CONTENT-")).length, 1);

    assert.equal(FLOW_IDS.length, 11);
    assert.equal(new Set(FLOW_IDS).size, 11);
  });

  it("preserves Unit 6 fixture counts", () => {
    assert.deepEqual(unit6FixtureCounts, {
      nodes: 128,
      edges: 669,
      tasks: 91,
      samplePathRows: 36,
      distinctSamplePaths: 6,
    });
  });

  it("keeps Persona A/B/C mapped to approved sample paths", () => {
    const personaPaths = Object.fromEntries(
      unit6Fixture.personas.map((persona) => [persona.persona_id, persona.mock_path_ids]),
    );

    assert.deepEqual(personaPaths.persona_a, ["PTH01"]);
    assert.deepEqual(personaPaths.persona_b, ["PTH03"]);
    assert.deepEqual(personaPaths.persona_c, ["PTH05", "PTH06"]);
  });

  it("keeps learner state dimensions separate", () => {
    const profile = unit6Fixture.learner_profiles.find((candidate) => candidate.learner_id === "stu_persona_b");
    assert.ok(profile);
    assert.ok(Array.isArray(profile.bkt_states));
    assert.equal(typeof profile.irt_state.theta, "number");
    assert.ok(Array.isArray(profile.bloom_profile));
    assert.equal(typeof profile.thinking_profile.rubric_version, "string");
  });

  it("marks every mock API response with the prototype notice", () => {
    const api = createInMemoryMockApi();
    const response = api.getStudentHome("stu_persona_a");

    assert.equal(response.mock, true);
    assert.equal(response.simulationNotice, MOCK_SIMULATION_NOTICE);
    assert.equal(response.data?.active_path?.path_id, "PTH01");
  });

  it("routes high-risk runtime submissions to review in memory", () => {
    const api = createInMemoryMockApi();
    const response = api.submitTask({
      learnerId: "stu_persona_c",
      taskId: "RW12",
      pathId: "PTH05",
      pathVersion: 1,
      responsePayloadRef: "mock://responses/test/persona_c/rw12",
      idempotencyKey: "idem_test_persona_c_rw12",
    });

    assert.equal(response.mock, true);
    assert.equal(response.simulationNotice, MOCK_SIMULATION_NOTICE);
    assert.equal(response.data.status, "REVIEW_PENDING");

    const reviewCases = api.listReviewCases().data;
    assert.ok(reviewCases.some((reviewCase) => reviewCase.object_id === response.data.submission_id));
  });

  it("enforces teacher decision reasons through the mock API runtime schema", () => {
    const api = createInMemoryMockApi();

    assert.throws(() =>
      api.recordTeacherDecision({
        actor_user_id: "usr_teacher_01",
        path_id: "PTH01",
        path_version: 1,
        action: "MODIFY",
      }),
    );

    assert.throws(() =>
      api.recordTeacherDecision({
        actor_user_id: "usr_teacher_01",
        path_id: "PTH01",
        path_version: 1,
        action: "REJECT",
        reason: "",
      }),
    );

    assert.throws(() =>
      api.recordTeacherDecision({
        actor_user_id: "usr_teacher_01",
        path_id: "PTH01",
        path_version: 1,
        action: "REPLAN",
        reason: "   ",
      }),
    );

    const approve = api.recordTeacherDecision({
      actor_user_id: "usr_teacher_01",
      path_id: "PTH01",
      path_version: 1,
      action: "APPROVE",
    });
    assert.equal(approve.data.action, "APPROVE");
    assert.equal(approve.data.reason_required, false);
    assert.equal(approve.data.reason_text, undefined);

    const modify = api.recordTeacherDecision({
      actor_user_id: "usr_teacher_01",
      path_id: "PTH01",
      path_version: 1,
      action: "MODIFY",
      reason: " shorten to fit class time ",
    });
    assert.equal(modify.data.action, "MODIFY");
    assert.equal(modify.data.reason_required, true);
    assert.equal(modify.data.reason_text, "shorten to fit class time");
  });

  it("enforces DecisionTrace reason_text at runtime", () => {
    assert.equal(
      DecisionTraceSchema.safeParse({
        ...baseDecisionTrace,
        action: "OVERRIDE",
      }).success,
      false,
    );

    assert.equal(
      DecisionTraceSchema.safeParse({
        ...baseDecisionTrace,
        action: "OVERRIDE",
        reason_text: "   ",
      }).success,
      false,
    );

    assert.equal(
      DecisionTraceSchema.safeParse({
        ...baseDecisionTrace,
        reason_required: true,
      }).success,
      false,
    );

    assert.equal(
      DecisionTraceSchema.safeParse({
        ...baseDecisionTrace,
        reason_required: true,
        reason_text: "   ",
      }).success,
      false,
    );

    const parsed = DecisionTraceSchema.parse({
      ...baseDecisionTrace,
      action: "OVERRIDE",
      reason_required: true,
      reason_text: " teacher changed task order ",
    });
    assert.equal(parsed.reason_text, "teacher changed task order");
  });

  it("does not deliver REVIEW, BLOCK, or REPLAN verifier paths", () => {
    for (const status of ["REVIEW", "BLOCK", "REPLAN"] as const) {
      const fixture = clonedFixtureWithVerifierStatus(status);
      const path = fixture.learning_paths[0];
      assert.ok(path);

      assert.equal(isLearningPathDeliverable(path), false);
      assert.equal(LearningPathSchema.safeParse(path).success, false);

      const api = createInMemoryMockApi(fixture);
      const home = api.getStudentHome("stu_persona_a");
      assert.equal(home.data?.active_path, undefined);
    }
  });

  it("delivers PASS paths that meet student delivery guards", () => {
    const path = unit6Fixture.learning_paths.find((candidate) => candidate.path_id === "PTH01");
    assert.ok(path);
    assert.equal(isLearningPathDeliverable(path), true);
    assert.equal(LearningPathSchema.safeParse(path).success, true);

    const api = createInMemoryMockApi();
    const home = api.getStudentHome("stu_persona_a");
    assert.equal(home.data?.active_path?.path_id, "PTH01");
  });
});
