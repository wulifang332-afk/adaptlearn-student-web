import { describe, expect, it } from "vitest";
import { scoreTaskResponse } from "@adaptlearn/shared";

describe("student task scoring contract", () => {
  it("scores task 1 label matching", () => {
    const feedback = scoreTaskResponse("UI01", {
      labels: { root: "root", stem: "stem", leaf: "leaf", seed: "seed" },
    });

    expect(feedback.summary).toBe("4 of 4 correct");
    expect(feedback.safeForStudent).toBe(true);
  });

  it("penalizes the wrong task 4 option", () => {
    const feedback = scoreTaskResponse("UI08", {
      selected: ["glucose", "oxygen", "growth", "water"],
    });

    expect(feedback.summary).toBe("2 of 3 correct");
  });

  it("uses speaking feedback without correct-count wording", () => {
    const feedback = scoreTaskResponse("UI17", {
      recordingState: "saved",
    });

    expect(feedback.feedbackKind).toBe("speaking");
    expect(feedback.summary).not.toContain("1 of 1 correct");
  });
});
