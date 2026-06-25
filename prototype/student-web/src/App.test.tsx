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

afterEach(cleanup);

describe("student web UI refinement", () => {
  it("renders Home without Path Goal and with due information", () => {
    renderRoute("/student");
    const copy = screenText();

    expect(copy).toContain("Grade 7 English");
    expect(copy).toContain("Unit 6");
    expect(copy).toContain("The Power of Plants");
    expect(copy).toContain("Today's Task");
    expect(copy).toContain("Due Today");
    expect(copy).toContain("Finish by 18:00");
    expect(copy).toContain("Mock progress");
    expect(copy).not.toContain("Path Goal");
    expect(copy).not.toContain("Current Persona");
    expect(copy).not.toContain("Persona A");
  });

  it("renders the six Bloom path steps with Start buttons", () => {
    renderRoute("/student/path/PTH01");
    const copy = screenText();

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

  it("renders structured task detail interactions without offline or diagram-ready messaging", () => {
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
    expect(copy).toContain("Helps the process");

    renderRoute("/student/tasks/UI03");
    copy = screenText();
    expect(copy).toContain("Roots take in water");
    expect(copy).toContain("Choose a step");

    renderRoute("/student/tasks/UI08");
    copy = screenText();
    expect(copy).toContain("Sunlight is missing");
    expect(copy).toContain("because");

    renderRoute("/student/tasks/UI04");
    copy = screenText();
    expect(copy).toContain("Choose the strongest explanation");
    expect(copy).toContain("uses evidence");
  });

  it("renders the Create task with microphone and simulated recording UI", () => {
    renderRoute("/student/tasks/UI17");
    const copy = screenText();

    expect(copy).toContain("Prototype voice");
    expect(copy).toContain("Retell photosynthesis");
    expect(buttonTexts()).toContain("Start recording");
    expect(document.querySelector("[aria-label='Simulated recording waveform']")).not.toBeNull();
  });

  it("renders Progress as credits, review notebook, retry actions, and reflection submit", () => {
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
    expect(copy).toContain("Class 7A");
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
