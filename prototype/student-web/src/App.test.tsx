import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Root[] = [];

const cleanup = () => {
  while (roots.length > 0) {
    const root = roots.pop();
    act(() => {
      root?.unmount();
    });
  }
  document.body.innerHTML = "";
  window.history.pushState(null, "", "/student");
};

const renderRoute = (path: string) => {
  cleanup();
  window.history.pushState(null, "", path);
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  roots.push(root);

  act(() => {
    root.render(<App />);
  });

  return host;
};

const screenText = () => document.body.textContent ?? "";

const buttonTexts = () =>
  Array.from(document.querySelectorAll("button")).map((button) => button.textContent?.replace(/\s+/g, " ").trim());

const clickButton = (label: string) => {
  const button = Array.from(document.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.replace(/\s+/g, " ").trim() === label,
  );
  if (!button) {
    throw new Error(`Button not found: ${label}`);
  }
  act(() => {
    button.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  });
};

afterEach(cleanup);

describe("student web UI refinement", () => {
  it("renders Home without the credits mock progress card", () => {
    renderRoute("/student");
    const copy = screenText();

    expect(copy).toContain("Grade 7 English");
    expect(copy).toContain("Unit 6");
    expect(copy).toContain("The Power of Plants");
    expect(copy).toContain("Today's Task");
    expect(copy).toContain("Due Today");
    expect(copy).toContain("Finish by 18:00");
    expect(copy).not.toContain("Credits");
    expect(copy).not.toContain("147");
    expect(copy).not.toContain("Mock progress");
    expect(copy).not.toContain("Path Goal");
    expect(copy).not.toContain("Current Persona");
    expect(copy).not.toContain("Persona A");
  });

  it("renders clean Step 1 through Step 6 labels with Start buttons", () => {
    renderRoute("/student/path/PTH01");
    const copy = screenText();

    [1, 2, 3, 4, 5, 6].forEach((step) => {
      expect(copy).toContain(`Step ${step}`);
    });
    ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"].forEach((level) => {
      expect(copy).toContain(level);
    });
    expect(copy).toContain("Label the parts of a plant");
    expect(copy).toContain("Classify photosynthesis inputs and outputs");
    expect(copy).toContain("Build the photosynthesis process");
    expect(copy).toContain("Find what changes when sunlight is missing");
    expect(copy).toContain("Choose the best explanation");
    expect(copy).toContain("Retell photosynthesis in your own words");
    expect(buttonTexts()).toContain("Start");
    expect(copy).not.toContain("Open");
  });

  it("renders structured task interactions without pre-submit answer keys", () => {
    renderRoute("/student/tasks/UI01");
    let copy = screenText();

    expect(copy).toContain("Match each plant word to the diagram.");
    expect(copy).toContain("Choose label");
    expect(copy).not.toContain("Diagram ready");
    expect(copy).not.toContain("Work offline");
    expect(copy).not.toContain("Offline ready");
    expect(copy).not.toContain("Write your mock response here");

    renderRoute("/student/tasks/UI02");
    copy = screenText();
    expect(copy).toContain("sunlight");
    expect(copy).toContain("Inputs");
    expect(copy).toContain("Outputs");
    expect(copy).toContain("Helpers");
    expect(copy).not.toContain("Helps the process");
    expect(copy).not.toContain("Correct answer shown after submit");
    expect(copy).not.toMatch(/Inputs:\s*water/i);
    expect(copy).not.toContain("Result");

    renderRoute("/student/tasks/UI03");
    copy = screenText();
    expect(copy).toContain("Roots take in water");
    expect(copy).toContain("Choose a step");

    renderRoute("/student/tasks/UI08");
    copy = screenText();
    expect(copy).toContain("Sunlight is missing");
    expect(copy).not.toContain("Sunlight gives energy to make food.");
    expect(copy).not.toContain("make glucose");
    expect(copy).not.toContain("release oxygen");

    renderRoute("/student/tasks/UI04");
    copy = screenText();
    expect(copy).toContain("Choose the strongest explanation");
    expect(copy).toContain("uses evidence");
  });

  it("shows scoring and answer feedback only after submit or check", () => {
    renderRoute("/student/tasks/UI02");
    expect(screenText()).not.toContain("Result");
    expect(screenText()).not.toContain("Correct answer shown after submit");

    clickButton("Check");
    expect(screenText()).toContain("Result");
    expect(screenText()).toContain("0 of 6 correct");
    expect(screenText()).toContain("Correct answer shown after submit");
    expect(screenText()).toContain("Inputs:");

    renderRoute("/student/tasks/UI08");
    expect(screenText()).not.toContain("Result");
    expect(screenText()).not.toContain("because energy helps leaves make glucose");

    clickButton("Check");
    expect(screenText()).toContain("Result");
    expect(screenText()).toContain("Correct answer shown after submit");
    expect(screenText()).toContain("because energy helps leaves make glucose");
  });

  it("removes repeated navigation controls from exercise pages", () => {
    ["/student/tasks/UI01", "/student/tasks/UI02", "/student/tasks/UI08", "/student/tasks/UI17"].forEach((route) => {
      renderRoute(route);
      const copy = screenText();

      expect(copy).not.toContain("Complete task");
      expect(copy).not.toContain("Next step");
      expect(copy).not.toContain("Try again");
      expect(copy).not.toContain("Start next");
    });
  });

  it("renders the Create task with microphone and simulated recording UI", () => {
    renderRoute("/student/tasks/UI17");
    let copy = screenText();

    expect(copy).toContain("Prototype voice");
    expect(copy).toContain("Retell photosynthesis");
    expect(buttonTexts()).toContain("Hold to speak");
    expect(document.querySelector("[aria-label='Simulated recording waveform']")).not.toBeNull();

    clickButton("Hold to speak");
    copy = screenText();
    expect(copy).toContain("Finish recording");
  });

  it("renders Progress as credits, review notebook, distinct similar practice, and reflection submit", () => {
    renderRoute("/student/progress");
    let copy = screenText();

    expect(copy).toContain("My Credits");
    expect(copy).toContain("Review Notebook");
    expect(copy).toContain("Retry Original");
    expect(copy).toContain("Practice Similar");
    expect(copy).toContain("Reflection");
    expect(copy).toContain("Submit");
    expect(copy).not.toContain("Vocabulary accuracy");
    expect(copy).not.toContain("Past Accuracy");

    Array.from(document.querySelectorAll("button"))
      .filter((button) => button.textContent?.replace(/\s+/g, " ").trim() === "Practice Similar")
      .forEach((button) => {
        act(() => {
          button.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        });
      });
    copy = screenText();
    expect(copy).toContain("Similar Practice");
    expect(copy).toContain("Label leaf, flower, and seed");
    expect(copy).toContain("Classify what a plant takes in and gives out during daytime");
    expect(copy).toContain("Order sunlight-to-oxygen steps");
    expect(copy).toContain("Pick the explanation with stronger evidence");

    const textarea = document.querySelector(".reflection-panel textarea") as HTMLTextAreaElement;
    act(() => {
      textarea.value = "I used sequence words.";
      textarea.dispatchEvent(new window.Event("input", { bubbles: true }));
    });
    const submitButton = Array.from(document.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Submit"),
    );
    act(() => {
      submitButton?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    });
    copy = screenText();
    expect(copy).toContain("Reflection submitted");
  });

  it("renders Profile with only the requested student profile sections", () => {
    renderRoute("/student/profile");
    const copy = screenText();

    expect(copy).toContain("Ability Profile");
    expect(copy).toContain("Thinking Skills");
    expect(copy).toContain("Learning Strategies");
    expect(copy).toContain("My Badges");
    expect(copy).toContain("My Class");
    expect(copy).toContain("Vocabulary Understanding");
    expect(copy).toContain("Process Sequencing");
    expect(copy).toContain("Explanation Quality");
    expect(copy).toContain("Class 104");
    expect(copy).toContain("Group 6");
    expect(copy).toContain("Enter Group Chat");
    expect(copy).not.toContain("Class 7A");
    expect(copy).not.toContain("Unit 6 Group");
    expect(copy).not.toContain("Start path");
    expect(copy).not.toContain("Learning Profile");
    expect(copy).not.toContain("Learning Credits");
    expect(copy).not.toContain("Past Accuracy");
    expect(copy).not.toContain("Review Collection");
    expect(copy).not.toContain("Learning Focus");
    expect(copy).not.toContain("Strategy Preference");
  });

  it("keeps rendered student UI English-only and free of internal admin leakage", () => {
    const routes = [
      "/student",
      "/student/path/PTH01",
      "/student/tasks/UI01",
      "/student/tasks/UI17",
      "/student/tasks/UI01/feedback",
      "/student/progress",
      "/student/profile",
    ];
    const blockedCopy = [
      "DecisionTrace",
      "Decision Trace",
      "teacher audit",
      "rule weight",
      "candidate exclusion",
      "ranking",
      "Teacher",
    ];

    routes.forEach((route) => {
      renderRoute(route);
      const copy = screenText();
      expect(copy).not.toMatch(/\p{Script=Han}/u);
      blockedCopy.forEach((blocked) => {
        expect(copy).not.toContain(blocked);
      });
    });
  });
});
