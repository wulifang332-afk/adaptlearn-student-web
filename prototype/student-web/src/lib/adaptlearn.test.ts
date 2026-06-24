import { describe, expect, it } from "vitest";
import {
  buildStudentExperience,
  buildTaskCards,
  createStudentRuntime,
  markTaskCompleteAndUnlockNext,
  parseRoute,
  routeToPath,
} from "./adaptlearn";

describe("student web shared foundation integration", () => {
  it("builds home data through the shared mock API and exposes only student-safe path fields", () => {
    const runtime = createStudentRuntime();
    const experience = buildStudentExperience(runtime, "stu_persona_a");

    expect(experience.student.persona_id).toBe("persona_a");
    expect(experience.activePath?.pathId).toBe("PTH01");
    expect(experience.activePath?.studentExplanation).toContain("Unit 6 practice needs");
    expect(experience.simulationNotice).toBe("Prototype data; not a real model result.");
    expect(JSON.stringify(experience)).not.toContain("teacher_text");
    expect(JSON.stringify(experience)).not.toContain("mock-rule-v0");
    expect(experience.taskCards).toHaveLength(5);
  });

  it("keeps the student-facing experience model English-only", () => {
    const runtime = createStudentRuntime();
    const experience = buildStudentExperience(runtime, "stu_persona_c");

    expect(JSON.stringify(experience)).not.toMatch(/\p{Script=Han}/u);
    expect(experience.activePath?.goal).toBe("Compare cultures and plan a short paragraph");
    expect(experience.taskCards.map((card) => card.title)).toContain("Write a short paragraph about tea and family");
  });

  it("filters non-deliverable learning paths from student task cards", () => {
    const runtime = createStudentRuntime();
    const path = structuredClone(runtime.api.fixture.learning_paths[0]);
    path.status = "TEACHER_REVIEW";

    expect(buildTaskCards(runtime, path)).toEqual([]);
  });

  it("marks a completed task and unlocks the next locked step locally", () => {
    const runtime = createStudentRuntime();
    const experience = buildStudentExperience(runtime, "stu_persona_a");
    const overrides = markTaskCompleteAndUnlockNext(experience.taskCards, "UI01");

    expect(overrides.UI01).toBe("COMPLETED");
    expect(overrides.UI02).toBe("AVAILABLE");
  });

  it("parses and serializes student routes", () => {
    expect(parseRoute("/student/path/PTH01")).toEqual({ screen: "path", pathId: "PTH01" });
    expect(parseRoute("/student/tasks/UI01")).toEqual({ screen: "task", taskId: "UI01" });
    expect(routeToPath({ screen: "feedback", taskId: "UI01" })).toBe("/student/tasks/UI01/feedback");
  });
});
