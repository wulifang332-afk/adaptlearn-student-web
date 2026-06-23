import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FLOW_IDS,
  MOCK_SIMULATION_NOTICE,
  SCREEN_IDS,
  createInMemoryMockApi,
  unit6Fixture,
  unit6FixtureCounts,
} from "../src/index.js";

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
});
