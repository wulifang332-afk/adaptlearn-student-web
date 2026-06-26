import { z } from "zod";

export const MOCK_SIMULATION_NOTICE = "Prototype data; not a real model result." as const;

export const taskStatusSchema = z.enum([
  "LOCKED",
  "AVAILABLE",
  "IN_PROGRESS",
  "COMPLETED",
  "REVIEW_PENDING",
  "WITHDRAWN",
]);

export const submissionStatusSchema = z.enum([
  "DRAFT",
  "SUBMITTING",
  "QUEUED_OFFLINE",
  "RECEIVED",
  "LINT_PASS",
  "ISOLATED",
  "REVIEW_PENDING",
  "APPLIED",
  "COMPLETED",
]);

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;

export type StudentProjectionName =
  | "student_home_view"
  | "student_learning_path_view"
  | "student_task_view"
  | "student_feedback_view"
  | "student_profile_summary_view"
  | "student_upload_status_view";

export type SafeStudentStatus =
  | "ready"
  | "review_pending"
  | "version_stale"
  | "unavailable"
  | "queued_sync"
  | "offline_unavailable";

export type SafeTaskCard = {
  stepNo: number;
  taskId: string;
  title: string;
  module: string;
  taskType: string;
  prompt: string;
  responseFormat: string;
  bloom: string;
  thinking: string;
  difficulty: string;
  minutes: number;
  status: TaskStatus;
  isActionable: boolean;
  nodeNames: string[];
  studentReason: string;
  riskLabel: string;
};

export type FeedbackKind = "score" | "speaking" | "practice";

export type StudentFeedback = {
  taskId: string;
  title: string;
  feedbackKind: FeedbackKind;
  correctCount: number;
  totalCount: number;
  resultText: string;
  summary: string;
  detail: string;
  safeForStudent: true;
};

export type StudentHome = {
  mock: true;
  simulationNotice: typeof MOCK_SIMULATION_NOTICE;
  projection: "student_home_view";
  safeStatus: SafeStudentStatus;
  student: {
    studentId: string;
    displayName: string;
    course: string;
  };
  unit: {
    id: "U6";
    title: "The Power of Plants";
    theme: string;
    dueLabel: string;
  };
  activePath: {
    pathId: string;
    goal: string;
    version: number;
    status: "PUBLISHED";
    totalMinutes: number;
    completedCount: number;
    totalCount: number;
    route: string;
    safeSyncStatus: SafeStudentStatus;
  };
  recommendedTask: SafeTaskCard;
};

export type StudentPath = {
  mock: true;
  simulationNotice: typeof MOCK_SIMULATION_NOTICE;
  projection: "student_learning_path_view";
  safeStatus: SafeStudentStatus;
  pathId: string;
  goal: string;
  version: number;
  status: "PUBLISHED";
  totalMinutes: number;
  completedCount: number;
  totalCount: number;
  taskCards: SafeTaskCard[];
};

export type StudentTask = SafeTaskCard & {
  projection: "student_task_view";
  safeStatus: SafeStudentStatus;
  interactionKind:
    | "plant_label"
    | "classification"
    | "sequence"
    | "multi_select"
    | "evaluation"
    | "speaking"
    | "similar_label"
    | "similar_classification"
    | "similar_sequence"
    | "similar_evaluation";
  options: Record<string, unknown>;
};

export type SubmissionRequest = {
  learnerId: string;
  taskId: string;
  pathId: string;
  pathVersion: number;
  idempotencyKey: string;
  response: Record<string, unknown>;
  mediaUploadId?: string;
};

export type SubmissionResponse = {
  projection: "student_feedback_view";
  safeStatus: SafeStudentStatus;
  submissionId: string;
  status: SubmissionStatus;
  feedback: StudentFeedback;
  nextTaskId?: string;
  agentRunId: string;
  toolCallId: string;
  traceId: string;
  requestId: string;
};

export type ProgressSummary = {
  credits: number;
  completedCount: number;
  totalCount: number;
  reviewItems: Array<{
    taskId: string;
    similarTaskId: string;
    title: string;
    focus: string;
    lastResult: string;
  }>;
};

export type ProfileSummary = {
  identity: {
    course: string;
    unit: string;
    unitTitle: string;
    focus: string;
  };
  abilities: Array<{ label: string; band: "Strong" | "Growing" | "Needs Practice"; note: string }>;
  thinkingSkills: Array<{ label: string; band: "Strong" | "Growing" | "Needs Practice"; next: string }>;
  strategies: string[];
  badges: Array<{ label: string; detail: string }>;
  classInfo: {
    name: string;
    group: string;
    weeklyGoal: string;
  };
};

export const pathTasks: SafeTaskCard[] = [
  {
    stepNo: 1,
    taskId: "UI01",
    title: "Label the parts of a plant",
    module: "Plant vocabulary",
    taskType: "Word-picture matching",
    prompt: "Match each plant word to the diagram.",
    responseFormat: "Select one label for each plant part.",
    bloom: "Remember",
    thinking: "Observation",
    difficulty: "Easy",
    minutes: 4,
    status: "AVAILABLE",
    isActionable: true,
    nodeNames: ["root", "stem", "leaf", "seed"],
    studentReason: "Focus: plant part words",
    riskLabel: "Low risk",
  },
  {
    stepNo: 2,
    taskId: "UI02",
    title: "Classify photosynthesis inputs and outputs",
    module: "Photosynthesis",
    taskType: "Classification",
    prompt: "Sort each card into Inputs, Outputs, or Helpers.",
    responseFormat: "Choose one category for each term.",
    bloom: "Understand",
    thinking: "Compare",
    difficulty: "Easy",
    minutes: 5,
    status: "LOCKED",
    isActionable: false,
    nodeNames: ["sunlight", "water", "carbon dioxide", "oxygen", "glucose", "chlorophyll"],
    studentReason: "Focus: inputs and outputs",
    riskLabel: "Low risk",
  },
  {
    stepNo: 3,
    taskId: "UI03",
    title: "Build the photosynthesis process",
    module: "Photosynthesis",
    taskType: "Process sequencing",
    prompt: "Put the photosynthesis events in the best order.",
    responseFormat: "Tap the cards in sequence.",
    bloom: "Apply",
    thinking: "Sequence",
    difficulty: "Medium",
    minutes: 6,
    status: "LOCKED",
    isActionable: false,
    nodeNames: ["water", "carbon dioxide", "sunlight", "glucose", "oxygen"],
    studentReason: "Focus: process order",
    riskLabel: "Low risk",
  },
  {
    stepNo: 4,
    taskId: "UI08",
    title: "Find what changes when sunlight is missing",
    module: "Cause and effect",
    taskType: "Multiple choice",
    prompt: "Choose the 3 changes caused by missing sunlight.",
    responseFormat: "Select all correct changes.",
    bloom: "Analyze",
    thinking: "Cause and effect",
    difficulty: "Medium",
    minutes: 5,
    status: "LOCKED",
    isActionable: false,
    nodeNames: ["glucose", "oxygen", "growth"],
    studentReason: "Focus: cause and effect",
    riskLabel: "Low risk",
  },
  {
    stepNo: 5,
    taskId: "UI04",
    title: "Choose the best explanation",
    module: "Evidence",
    taskType: "Explanation evaluation",
    prompt: "Choose the strongest explanation and the reason.",
    responseFormat: "Pick one explanation and one reason.",
    bloom: "Evaluate",
    thinking: "Evidence use",
    difficulty: "Medium",
    minutes: 6,
    status: "LOCKED",
    isActionable: false,
    nodeNames: ["evidence", "cause and effect"],
    studentReason: "Focus: stronger evidence",
    riskLabel: "Low risk",
  },
  {
    stepNo: 6,
    taskId: "UI17",
    title: "Retell photosynthesis in your own words",
    module: "Speaking",
    taskType: "Oral retelling",
    prompt: "Record a short retelling of photosynthesis.",
    responseFormat: "Simulated short audio recording.",
    bloom: "Create",
    thinking: "Explain",
    difficulty: "Medium",
    minutes: 7,
    status: "LOCKED",
    isActionable: false,
    nodeNames: ["sunlight", "glucose", "oxygen"],
    studentReason: "Focus: clear oral explanation",
    riskLabel: "Extra review",
  },
];

export const similarTasks: Record<string, Pick<StudentTask, "taskId" | "title" | "prompt" | "bloom" | "interactionKind">> = {
  SIM_UI01: {
    taskId: "SIM_UI01",
    title: "Label leaf, flower, and seed",
    prompt: "Use a new plant picture and match each visible part to the correct word.",
    bloom: "Remember",
    interactionKind: "similar_label",
  },
  SIM_UI02: {
    taskId: "SIM_UI02",
    title: "Classify daytime plant exchange",
    prompt: "Sort what enters the plant, what leaves it, and what is not used here.",
    bloom: "Understand",
    interactionKind: "similar_classification",
  },
  SIM_UI03: {
    taskId: "SIM_UI03",
    title: "Order sunlight-to-oxygen steps",
    prompt: "Put the events in order from sunlight reaching a leaf to oxygen leaving the plant.",
    bloom: "Apply",
    interactionKind: "similar_sequence",
  },
  SIM_UI04: {
    taskId: "SIM_UI04",
    title: "Pick the explanation with stronger evidence",
    prompt: "Compare two new explanations and choose the one that uses better plant-process evidence.",
    bloom: "Evaluate",
    interactionKind: "similar_evaluation",
  },
};

export const scoreTaskResponse = (taskId: string, response: Record<string, unknown>): StudentFeedback => {
  const sourceTaskId = taskId.replace(/^SIM_/, "");
  const practice = taskId.startsWith("SIM_");

  if (sourceTaskId === "UI01") {
    const labels = response.labels as Record<string, string> | undefined;
    const expected: Record<string, string> = practice
      ? { top: "flower", middle: "leaf", bottom: "seed" }
      : { root: "root", stem: "stem", leaf: "leaf", seed: "seed" };
    const correct = Object.entries(expected).filter(([key, value]) => labels?.[key] === value).length;
    return buildFeedback(taskId, practice ? "Label leaf, flower, and seed" : "Label the parts of a plant", practice, correct, Object.keys(expected).length);
  }

  if (sourceTaskId === "UI02") {
    const zones = response.classification as Record<string, string> | undefined;
    const expected: Record<string, string> = practice
      ? { water: "takenIn", carbonDioxide: "takenIn", oxygen: "givenOut", glucose: "notUsed", soil: "notUsed", sunlight: "notUsed" }
      : { sunlight: "inputs", water: "inputs", carbonDioxide: "inputs", oxygen: "outputs", glucose: "outputs", chlorophyll: "helpers" };
    const correct = Object.entries(expected).filter(([key, value]) => zones?.[key] === value).length;
    return buildFeedback(taskId, practice ? "Classify daytime plant exchange" : "Classify photosynthesis inputs and outputs", practice, correct, Object.keys(expected).length);
  }

  if (sourceTaskId === "UI03") {
    const order = response.order as string[] | undefined;
    const expected = practice ? ["sunlight", "glucose", "oxygen"] : ["water", "carbon", "sunlight", "glucose", "oxygen"];
    const correct = expected.filter((value, index) => order?.[index] === value).length;
    return buildFeedback(taskId, practice ? "Order sunlight-to-oxygen steps" : "Build the photosynthesis process", practice, correct, expected.length);
  }

  if (sourceTaskId === "UI08") {
    const selected = new Set((response.selected as string[] | undefined) ?? []);
    const correctItems = ["glucose", "oxygen", "growth"];
    const wrongItems = ["water"];
    const raw = correctItems.filter((item) => selected.has(item)).length - wrongItems.filter((item) => selected.has(item)).length;
    return buildFeedback(taskId, "Find what changes when sunlight is missing", false, Math.max(0, raw), 3);
  }

  if (sourceTaskId === "UI04") {
    const explanation = response.explanation;
    const reason = response.reason;
    const correct = Number(explanation === "strong" || explanation === "better") + Number(reason === "causeEffect" || reason === "evidence");
    return buildFeedback(taskId, practice ? "Pick the explanation with stronger evidence" : "Choose the best explanation", practice, correct, 2);
  }

  if (sourceTaskId === "UI17") {
    return {
      taskId,
      title: "Retell photosynthesis in your own words",
      feedbackKind: "speaking",
      correctCount: 0,
      totalCount: 0,
      resultText: "Speaking feedback",
      summary: "Retelling draft saved.",
      detail: "Good retelling start. Try adding sunlight, glucose, and oxygen in one clear sequence.",
      safeForStudent: true,
    };
  }

  return buildFeedback(taskId, "Practice", practice, 0, 1);
};

const buildFeedback = (
  taskId: string,
  title: string,
  practice: boolean,
  correctCount: number,
  totalCount: number,
): StudentFeedback => ({
  taskId,
  title,
  feedbackKind: practice ? "practice" : "score",
  correctCount,
  totalCount,
  resultText: practice ? "Practice feedback" : "Result",
  summary: practice ? "Same skill, new example." : `${correctCount} of ${totalCount} correct`,
  detail:
    correctCount === totalCount
      ? "Nice work. You can move to the next step."
      : "Review the plant-process evidence, then try the next guided step.",
  safeForStudent: true,
});
