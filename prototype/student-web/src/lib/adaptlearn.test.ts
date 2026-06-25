import { describe, expect, it } from "vitest";
import {
  buildStudentExperience,
  buildTaskCards,
  COURSE_OPTIONS,
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
    expect(experience.activePath?.studentExplanation).toBe("Ready path");
    expect(experience.activePath?.goalTags).toEqual(["6 Bloom steps", "Plant process"]);
    expect(experience.simulationNotice).toBe("Prototype data");
    expect(experience.studentProfile.identity.focus).toBe("Vocabulary foundation");
    expect(JSON.stringify(experience)).not.toContain("teacher_text");
    expect(JSON.stringify(experience)).not.toContain("mock-rule-v0");
    expect(experience.taskCards).toHaveLength(6);
  });

  it("keeps the student-facing experience model English-only", () => {
    const runtime = createStudentRuntime();
    const experience = buildStudentExperience(runtime, "stu_persona_c");

    expect(JSON.stringify(experience)).not.toMatch(/\p{Script=Han}/u);
    expect(experience.activePath?.goal).toBe("Culture comparison");
    expect(experience.taskCards.map((card) => card.title)).toContain("Write a short paragraph about tea and family");
  });

  it("keeps removed long copy out of student-facing path and task data", () => {
    const runtime = createStudentRuntime();
    const experience = buildStudentExperience(runtime, "stu_persona_a");
    const studentFacingCopy = JSON.stringify({
      activePath: experience.activePath,
      recommendedTask: experience.recommendedTask,
      taskCards: experience.taskCards,
      progress: experience.progress,
      simulationNotice: experience.simulationNotice,
    });
    const removedCopy = [
      ["Today starts", "with a short Unit 6 practice path matched to", ["Persona", "A"].join(" "), "."].join(" "),
      ["Prototype data; not a real model", "result. All progress and feedback shown here is simulated."].join(" "),
      ["This path starts", "with tasks matched to your current Unit 6 practice needs."].join(" "),
      ["Label root, stem, leaf", "and seed on a self-made plant diagram."].join(", "),
      ["Immediate practice", "feedback"].join(" "),
      ["Offline queue is", "visible"].join(" "),
      ["Audio", "draft for a later speaking task is queued locally and can retry after reconnect."].join(" "),
    ];

    removedCopy.forEach((copy) => {
      expect(studentFacingCopy).not.toContain(copy);
    });
  });

  it("builds a student-safe profile model and route", () => {
    const runtime = createStudentRuntime();
    const experience = buildStudentExperience(runtime, "stu_persona_a");
    const profile = experience.studentProfile;
    const profileCopy = JSON.stringify(profile);
    const courseLabels = COURSE_OPTIONS.map((course) => course.label);
    const blockedInternalCopy = [
      ["Decision", "Trace"].join(""),
      ["teacher", "audit"].join(" "),
      ["rule", "weight"].join(" "),
      ["candidate", "exclusion"].join(" "),
      ["rank", "ing"].join(""),
    ];

    expect(courseLabels).toEqual(["Grade 7 English"]);
    expect(courseLabels.join(" ")).not.toContain(["Persona", "A"].join(" "));
    expect(courseLabels.join(" ")).not.toContain(["Persona", "B"].join(" "));
    expect(courseLabels.join(" ")).not.toContain(["Persona", "C"].join(" "));
    expect(parseRoute("/student/profile")).toEqual({ screen: "profile" });
    expect(routeToPath({ screen: "profile" })).toBe("/student/profile");
    expect(profile.identity).toMatchObject({
      course: "Grade 7 English",
      unit: "Unit 6",
      unitTitle: "The Power of Plants",
      focus: "Vocabulary foundation",
      preference: "Read aloud",
    });
    expect(profile.credits.map((credit) => credit.label)).toEqual(
      expect.arrayContaining(["Practice Credits", "Reflection Credits", "Vocabulary Builder", "Evidence Collector"]),
    );
    expect(profile.creditTotal).toBeGreaterThanOrEqual(128);
    expect(profile.accuracy.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        "Overall accuracy",
        "Recent practice accuracy",
        "Vocabulary accuracy",
        "Reading/order accuracy",
      ]),
    );
    expect(profile.reviewItems.map((item) => item.label)).toEqual(
      expect.arrayContaining(["Needs Review", "Try Again"]),
    );
    expect(profile.reviewItems.map((item) => item.title)).toEqual(
      expect.arrayContaining([
        "Label root and stem",
        "Classify photosynthesis inputs",
        "Order photosynthesis steps",
        "Choose the best explanation",
      ]),
    );
    expect(profile.abilities.map((ability) => ability.label)).toEqual(
      expect.arrayContaining([
        "Vocabulary Understanding",
        "Sentence Comprehension",
        "Process Sequencing",
        "Evidence Use",
        "Explanation Quality",
      ]),
    );
    expect(profile.thinkingSkills.map((skill) => skill.label)).toEqual(
      expect.arrayContaining(["Observe", "Compare", "Sequence", "Explain", "Reflect"]),
    );
    expect(profile.thinkingSkills.every((skill) => skill.level > 0)).toBe(true);
    expect(profile.strategies).toContain("Read aloud");
    expect(profile.badges.map((badge) => badge.label)).toEqual(
      expect.arrayContaining(["Vocabulary Builder", "Evidence Finder", "Sequence Starter", "Reflection Rookie"]),
    );
    expect(profile.classInfo).toMatchObject({
      name: "Class 104",
      group: "Group 6",
      weeklyGoal: "Finish 6-step path",
    });
    expect(profileCopy).not.toMatch(/\p{Script=Han}/u);
    blockedInternalCopy.forEach((copy) => {
      expect(profileCopy).not.toContain(copy);
    });
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

  it("presents PTH01 as a six-step Bloom-aligned student path", () => {
    const runtime = createStudentRuntime();
    const experience = buildStudentExperience(runtime, "stu_persona_a");

    expect(experience.taskCards.map((card) => card.bloom)).toEqual([
      "Remember",
      "Understand",
      "Apply",
      "Analyze",
      "Evaluate",
      "Create",
    ]);
    expect(experience.taskCards.map((card) => card.title)).toEqual([
      "Label the parts of a plant",
      "Classify photosynthesis inputs and outputs",
      "Build the photosynthesis process",
      "Find what changes when sunlight is missing",
      "Choose the best explanation",
      "Retell photosynthesis in your own words",
    ]);
    expect(experience.activePath?.totalCount).toBe(6);
  });

  it("parses and serializes student routes", () => {
    expect(parseRoute("/student/path/PTH01")).toEqual({ screen: "path", pathId: "PTH01" });
    expect(parseRoute("/student/tasks/UI01")).toEqual({ screen: "task", taskId: "UI01" });
    expect(parseRoute("/student/progress")).toEqual({ screen: "growth" });
    expect(parseRoute("/student/growth")).toEqual({ screen: "growth" });
    expect(parseRoute("/student/profile")).toEqual({ screen: "profile" });
    expect(routeToPath({ screen: "feedback", taskId: "UI01" })).toBe("/student/tasks/UI01/feedback");
    expect(routeToPath({ screen: "growth" })).toBe("/student/progress");
    expect(routeToPath({ screen: "profile" })).toBe("/student/profile");
  });
});
