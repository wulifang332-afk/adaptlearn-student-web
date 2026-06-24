import {
  DecisionTraceSchema,
  FLOW_IDS,
  FLOW_SCREEN_MAP,
  GUARDRAILS,
  LearningPathSchema,
  ROLE_PERMISSIONS,
  SCREEN_IDS,
  SCREEN_PRIORITIES,
  SCREEN_ROUTES,
  STUDENT_FORBIDDEN_FIELDS,
  createInMemoryMockApi,
  isLearningPathDeliverable,
  unit6Fixture,
} from "../src/index.js";
import { MOCK_SIMULATION_NOTICE, MockMetaSchema } from "../src/schemas/index.js";

const fail = (message: string): never => {
  throw new Error(message);
};

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    fail(message);
  }
};

assert(SCREEN_IDS.length === 16, `Expected 16 screen IDs, got ${SCREEN_IDS.length}`);
assert(FLOW_IDS.length === 11, `Expected 11 flow IDs, got ${FLOW_IDS.length}`);
assert(new Set(SCREEN_IDS).size === 16, "Screen IDs must be unique");
assert(new Set(FLOW_IDS).size === 11, "Flow IDs must be unique");
assert(SCREEN_IDS.includes("ADM-CONTENT-001"), "ADM-CONTENT-001 must exist");
assert(
  SCREEN_IDS.filter((screenId) => screenId.startsWith("ADM-CONTENT-")).length === 1,
  "ADM-CONTENT-001 must be the only content screen",
);

for (const screenId of SCREEN_IDS) {
  assert(Boolean(SCREEN_ROUTES[screenId]), `Missing route for ${screenId}`);
  assert(Boolean(SCREEN_PRIORITIES[screenId]), `Missing priority for ${screenId}`);
}

for (const flowId of FLOW_IDS) {
  assert(Boolean(FLOW_SCREEN_MAP[flowId]), `Missing screen map for ${flowId}`);
  for (const screenId of FLOW_SCREEN_MAP[flowId]) {
    assert(SCREEN_IDS.includes(screenId as (typeof SCREEN_IDS)[number]), `Flow ${flowId} references missing screen ${screenId}`);
  }
}

assert(GUARDRAILS.blockCannotPublishRecommendOrUpdate, "BLOCK guardrail missing");
assert(GUARDRAILS.reviewMustCreateReviewCase, "REVIEW guardrail missing");
assert(GUARDRAILS.teacherOverrideRequiresReasonAndDecisionTrace, "Teacher override guardrail missing");
assert(GUARDRAILS.studentsCanAccessOnlyOwnData, "Student access guardrail missing");
assert(GUARDRAILS.noRealLmsLlmBktIrtRecommendationOrDatabase, "No-real-service guardrail missing");
assert(STUDENT_FORBIDDEN_FIELDS.includes("internal_rule_weights"), "Student forbidden fields must hide rule weights");
assert(ROLE_PERMISSIONS.student.every((permission) => permission === "own_learning_path:read_published"), "Student permissions too broad");

const api = createInMemoryMockApi(unit6Fixture);
const responses = [
  api.getUnitOverview(),
  api.listKnowledgeNodes(),
  api.listTasks(),
  api.getTask("UI01"),
  api.getLearnerProfile("stu_persona_a"),
  api.getLearningPath("PTH01", "stu_persona_a"),
  api.getStudentHome("stu_persona_a"),
  api.listReviewCases(),
  api.listSubmissions("stu_persona_c"),
  api.submitTask({
    learnerId: "stu_persona_c",
    taskId: "RW12",
    pathId: "PTH05",
    pathVersion: 1,
    responsePayloadRef: "mock://responses/runtime/persona_c/rw12",
    idempotencyKey: "idem_runtime_persona_c_rw12",
  }),
  api.recordTeacherDecision({
    actor_user_id: "usr_teacher_01",
    path_id: "PTH01",
    path_version: 1,
    action: "APPROVE",
  }),
  api.recordTeacherDecision({
    actor_user_id: "usr_teacher_01",
    path_id: "PTH01",
    path_version: 1,
    action: "MODIFY",
    reason: "Adjust sequence for class time.",
  }),
];

for (const response of responses) {
  MockMetaSchema.parse(response);
  assert(response.mock === true, "Mock API response missing mock:true");
  assert(response.simulationNotice === MOCK_SIMULATION_NOTICE, "Mock API response missing simulation notice");
}

const profile = unit6Fixture.learner_profiles[0];
assert(Boolean(profile), "Missing learner profile");
assert(Array.isArray(profile!.bkt_states), "BKT state must stay separate");
assert(typeof profile!.irt_state.theta === "number", "IRT state must stay separate");
assert(Array.isArray(profile!.bloom_profile), "Bloom profile must stay separate");
assert(typeof profile!.thinking_profile.rubric_version === "string", "Thinking profile must stay separate");

const personaMap = Object.fromEntries(unit6Fixture.personas.map((persona) => [persona.persona_id, persona.mock_path_ids]));
assert(personaMap.persona_a?.includes("PTH01") ?? false, "Persona A must map to PTH01");
assert(personaMap.persona_b?.includes("PTH03") ?? false, "Persona B must map to PTH03");
assert(personaMap.persona_c?.includes("PTH05") ?? false, "Persona C must map to PTH05");

const deliverablePath = unit6Fixture.learning_paths.find((path) => path.path_id === "PTH01");
assert(Boolean(deliverablePath), "Missing deliverable path fixture");
assert(isLearningPathDeliverable(deliverablePath!), "PTH01 must be deliverable");

for (const status of ["REVIEW", "BLOCK", "REPLAN"] as const) {
  const invalidPath = {
    ...deliverablePath!,
    status: "PUBLISHED" as const,
    verifier_result: {
      ...deliverablePath!.verifier_result,
      status,
    },
  };
  assert(!isLearningPathDeliverable(invalidPath), `${status} path must not be deliverable`);
  assert(!LearningPathSchema.safeParse(invalidPath).success, `PUBLISHED + ${status} must fail schema`);
}

const baseDecisionTrace = {
  trace_id: "trace_contract_reason",
  actor_user_id: "usr_teacher_01",
  action: "APPROVE" as const,
  reason_required: false,
  before_snapshot_ref: "learning_path:PTH01:v1",
  created_at: "2026-06-23T04:30:00.000Z",
};
assert(
  !DecisionTraceSchema.safeParse({ ...baseDecisionTrace, action: "OVERRIDE" }).success,
  "OVERRIDE DecisionTrace must require reason_text",
);
assert(
  !DecisionTraceSchema.safeParse({ ...baseDecisionTrace, reason_required: true }).success,
  "reason_required DecisionTrace must require reason_text",
);
assert(
  DecisionTraceSchema.safeParse({
    ...baseDecisionTrace,
    action: "OVERRIDE",
    reason_required: true,
    reason_text: "Teacher override reason.",
  }).success,
  "DecisionTrace with required reason_text must pass",
);

console.log("Contract validation passed");
console.log(
  JSON.stringify(
    {
      screens: SCREEN_IDS.length,
      flows: FLOW_IDS.length,
      mock_api_responses_checked: responses.length,
      simulation_notice: MOCK_SIMULATION_NOTICE,
      persona_paths: personaMap,
    },
    null,
    2,
  ),
);
