import {
  createInMemoryMockApi,
  isLearningPathDeliverable,
  MOCK_SIMULATION_NOTICE,
  SCREEN_ROUTES,
  type BKTKnowledgeState,
  type BloomEvidenceProfile,
  type InMemoryAdaptLearnMockApi,
  type KnowledgeNode,
  type LearnerProfile,
  type LearningPath,
  type PathStep,
  type Persona,
  type Student,
  type StudentSubmission,
  type Task,
  type ThinkingQualityProfile,
} from "@adaptlearn/shared-foundation";

export const STUDENT_IDS = ["stu_persona_a", "stu_persona_b", "stu_persona_c"] as const;
export type StudentId = (typeof STUDENT_IDS)[number];

export type RouteState =
  | { screen: "home" }
  | { screen: "path"; pathId: string }
  | { screen: "task"; taskId: string }
  | { screen: "feedback"; taskId: string }
  | { screen: "growth" };

export type StepOverrideMap = Record<string, PathStep["status"]>;

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
  difficulty: Task["difficulty"];
  minutes: number;
  status: PathStep["status"];
  isActionable: boolean;
  nodeNames: string[];
  studentReason: string;
  learningStrategies: string[];
  cognitiveStrategies: string[];
  riskLabel: string;
};

export type SafeProgressSummary = {
  knowledge: Array<{
    nodeId: string;
    name: string;
    label: "Needs practice" | "Growing" | "Steady";
    confidence: BKTKnowledgeState["confidence"];
    evidenceCount: number;
  }>;
  bloom: Array<{
    label: string;
    confirmed: number;
    emerging: number;
    needsEvidence: number;
  }>;
  strategies: Array<{ label: string; count: number }>;
  thinking: Array<{ label: string; state: string; helper: string }>;
  evidenceCoverageLabel: string;
};

export type StudentExperience = {
  student: Student;
  persona: Persona;
  profile: LearnerProfile;
  activePath:
    | {
        pathId: string;
        goal: string;
        version: number;
        status: LearningPath["status"];
        totalMinutes: number;
        completedCount: number;
        totalCount: number;
        studentExplanation: string;
        route: string;
      }
    | undefined;
  recommendedTask: SafeTaskCard | undefined;
  taskCards: SafeTaskCard[];
  progress: SafeProgressSummary;
  simulationNotice: typeof MOCK_SIMULATION_NOTICE;
  screenRoutes: typeof SCREEN_ROUTES;
};

export type Runtime = {
  api: InMemoryAdaptLearnMockApi;
};

export const createStudentRuntime = (): Runtime => ({
  api: createInMemoryMockApi(),
});

export const parseRoute = (pathname: string): RouteState => {
  const pathMatch = pathname.match(/^\/student\/path\/([^/]+)$/);
  if (pathMatch) {
    return { screen: "path", pathId: decodeURIComponent(pathMatch[1]) };
  }

  const feedbackMatch = pathname.match(/^\/student\/tasks\/([^/]+)\/feedback$/);
  if (feedbackMatch) {
    return { screen: "feedback", taskId: decodeURIComponent(feedbackMatch[1]) };
  }

  const taskMatch = pathname.match(/^\/student\/tasks\/([^/]+)$/);
  if (taskMatch) {
    return { screen: "task", taskId: decodeURIComponent(taskMatch[1]) };
  }

  if (pathname === "/student/growth") {
    return { screen: "growth" };
  }

  return { screen: "home" };
};

export const routeToPath = (route: RouteState): string => {
  switch (route.screen) {
    case "path":
      return `/student/path/${route.pathId}`;
    case "task":
      return `/student/tasks/${route.taskId}`;
    case "feedback":
      return `/student/tasks/${route.taskId}/feedback`;
    case "growth":
      return "/student/growth";
    case "home":
    default:
      return "/student";
  }
};

export const buildStudentExperience = (
  runtime: Runtime,
  studentId: StudentId,
  stepOverrides: StepOverrideMap = {},
): StudentExperience => {
  const homeResponse = runtime.api.getStudentHome(studentId);
  if (!homeResponse.data?.active_path) {
    throw new Error(`No deliverable learning path for ${studentId}`);
  }

  const { student, learner_profile: profile, active_path: activePath } = homeResponse.data;
  const persona = runtime.api.fixture.personas.find((candidate) => candidate.persona_id === student.persona_id);
  if (!persona) {
    throw new Error(`No persona fixture for ${student.persona_id}`);
  }

  const taskCards = buildTaskCards(runtime, activePath, stepOverrides);
  const recommendedTask =
    taskCards.find((card) => card.status === "IN_PROGRESS") ??
    taskCards.find((card) => card.status === "AVAILABLE") ??
    taskCards.find((card) => card.status === "LOCKED") ??
    taskCards[0];

  return {
    student,
    persona,
    profile,
    activePath: {
      pathId: activePath.path_id,
      goal: activePath.goal,
      version: activePath.version,
      status: activePath.status,
      totalMinutes: activePath.steps.reduce((total, step) => total + step.minutes, 0),
      completedCount: taskCards.filter((card) => card.status === "COMPLETED").length,
      totalCount: taskCards.length,
      studentExplanation: activePath.teacher_audit_explanation.student_text,
      route: `/student/path/${activePath.path_id}`,
    },
    recommendedTask,
    taskCards,
    progress: buildSafeProgressSummary(profile, runtime.api.fixture.knowledge_nodes, taskCards),
    simulationNotice: homeResponse.simulationNotice,
    screenRoutes: SCREEN_ROUTES,
  };
};

export const buildTaskCards = (
  runtime: Runtime,
  path: LearningPath,
  stepOverrides: StepOverrideMap = {},
): SafeTaskCard[] => {
  if (!isLearningPathDeliverable(path)) {
    return [];
  }

  return path.steps.map((step) => {
    const task = runtime.api.fixture.tasks.find((candidate) => candidate.task_id === step.task_id);
    if (!task) {
      throw new Error(`Missing task fixture: ${step.task_id}`);
    }

    const status = stepOverrides[step.task_id] ?? step.status;
    const nodeNames = step.target_node_ids.map((nodeId) => findNodeLabel(runtime.api.fixture.knowledge_nodes, nodeId));

    return {
      stepNo: step.step_no,
      taskId: task.task_id,
      title: task.title,
      module: task.module,
      taskType: task.task_type,
      prompt: task.student_prompt,
      responseFormat: task.response_format,
      bloom: task.bloom,
      thinking: task.thinking_primary,
      difficulty: task.difficulty,
      minutes: step.minutes,
      status,
      isActionable: status === "AVAILABLE" || status === "IN_PROGRESS" || status === "COMPLETED",
      nodeNames,
      studentReason: explainStepForStudent(step, nodeNames),
      learningStrategies: task.learning_strategy,
      cognitiveStrategies: task.cognitive_strategy,
      riskLabel: riskToStudentLabel(task.review_risk),
    };
  });
};

export const markTaskCompleteAndUnlockNext = (
  taskCards: SafeTaskCard[],
  completedTaskId: string,
): StepOverrideMap => {
  const overrides: StepOverrideMap = {};
  taskCards.forEach((card, index) => {
    if (card.taskId === completedTaskId) {
      overrides[card.taskId] = "COMPLETED";
      const nextCard = taskCards[index + 1];
      if (nextCard?.status === "LOCKED") {
        overrides[nextCard.taskId] = "AVAILABLE";
      }
    }
  });
  return overrides;
};

export const submitMockTask = (
  runtime: Runtime,
  input: {
    learnerId: string;
    taskId: string;
    pathId: string;
    pathVersion: number;
    offline: boolean;
  },
): StudentSubmission => {
  return runtime.api.submitTask({
    learnerId: input.learnerId,
    taskId: input.taskId,
    pathId: input.pathId,
    pathVersion: input.pathVersion,
    responsePayloadRef: `mock://student-web/${input.learnerId}/${input.taskId}`,
    idempotencyKey: `student-web-${input.learnerId}-${input.taskId}-${Date.now()}`,
    offline: input.offline,
  }).data;
};

export const findNodeLabel = (nodes: KnowledgeNode[], nodeId: string): string => {
  const node = nodes.find((candidate) => candidate.node_id === nodeId);
  if (!node) {
    return nodeId;
  }
  return node.english_label ? `${node.name} (${node.english_label})` : node.name;
};

const buildSafeProgressSummary = (
  profile: LearnerProfile,
  nodes: KnowledgeNode[],
  taskCards: SafeTaskCard[],
): SafeProgressSummary => {
  return {
    knowledge: profile.bkt_states.slice(0, 6).map((state) => ({
      nodeId: state.node_id,
      name: findNodeLabel(nodes, state.node_id),
      label: masteryToFriendlyLabel(state.mastery_probability),
      confidence: state.confidence,
      evidenceCount: state.evidence_count,
    })),
    bloom: summarizeBloom(profile.bloom_profile),
    strategies: summarizeStrategies(taskCards),
    thinking: summarizeThinking(profile.thinking_profile),
    evidenceCoverageLabel: coverageToLabel(profile.thinking_profile.evidence_coverage),
  };
};

const masteryToFriendlyLabel = (value: number): "Needs practice" | "Growing" | "Steady" => {
  if (value >= 0.66) {
    return "Steady";
  }
  if (value >= 0.5) {
    return "Growing";
  }
  return "Needs practice";
};

const summarizeBloom = (profiles: BloomEvidenceProfile[]): SafeProgressSummary["bloom"] => {
  const dimensions = [
    ["Remember", "remember"],
    ["Understand", "understand"],
    ["Apply", "apply"],
    ["Analyze", "analyze"],
    ["Evaluate", "evaluate"],
    ["Create", "create"],
  ] as const;

  return dimensions.map(([label, key]) => {
    const values = profiles.map((profile) => profile[key]);
    return {
      label,
      confirmed: values.filter((value) => value === "CONFIRMED").length,
      emerging: values.filter((value) => value === "EMERGING").length,
      needsEvidence: values.filter((value) => value === "INSUFFICIENT" || value === "NOT_ASSESSED").length,
    };
  });
};

const summarizeStrategies = (taskCards: SafeTaskCard[]): SafeProgressSummary["strategies"] => {
  const counts = new Map<string, number>();
  taskCards.flatMap((card) => card.learningStrategies).forEach((strategy) => {
    counts.set(strategy, (counts.get(strategy) ?? 0) + 1);
  });

  return [...counts.entries()]
    .sort((first, second) => second[1] - first[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));
};

const summarizeThinking = (thinking: ThinkingQualityProfile): SafeProgressSummary["thinking"] => [
  {
    label: "Observation & discrimination",
    state: thinkingLevelLabel(thinking.observation_discrimination),
    helper: "Notice words, images, and evidence before answering.",
  },
  {
    label: "Induction & inference",
    state: thinkingLevelLabel(thinking.induction_inference),
    helper: "Use clues to explain why an answer fits.",
  },
  {
    label: "Critique & creation",
    state: thinkingLevelLabel(thinking.critique_creation),
    helper: "Build your own reasoned response step by step.",
  },
];

const thinkingLevelLabel = (value: ThinkingQualityProfile[keyof ThinkingQualityProfile]): string => {
  if (value === "EVIDENCE_INSUFFICIENT") {
    return "More evidence needed";
  }
  if (typeof value === "string" && value.startsWith("T")) {
    return `Stage ${value.slice(1)}`;
  }
  return "Growing";
};

const coverageToLabel = (value: number): string => {
  if (value >= 0.7) {
    return "Broad evidence";
  }
  if (value >= 0.45) {
    return "Some evidence";
  }
  return "Early evidence";
};

const explainStepForStudent = (step: PathStep, nodeNames: string[]): string => {
  const focus = nodeNames.slice(0, 2).join(" and ");
  return `This step helps you practise ${focus || "Unit 6 skills"} in a manageable ${step.minutes}-minute task.`;
};

const riskToStudentLabel = (risk: Task["review_risk"]): string => {
  if (risk === "高") {
    return "Teacher review after submit";
  }
  if (risk === "中") {
    return "May be reviewed by teacher";
  }
  return "Immediate practice feedback";
};
