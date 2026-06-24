import {
  createInMemoryMockApi,
  isLearningPathDeliverable,
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

export const COURSE_OPTIONS = [
  { id: "grade7_english", label: "Grade 7 English" },
  { id: "high_school_english", label: "High School English" },
  { id: "high_school_math", label: "High School Math" },
] as const;
export type CourseId = (typeof COURSE_OPTIONS)[number]["id"];

export type RouteState =
  | { screen: "home" }
  | { screen: "path"; pathId: string }
  | { screen: "task"; taskId: string }
  | { screen: "feedback"; taskId: string }
  | { screen: "growth" }
  | { screen: "profile" };

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
  difficulty: string;
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

export type AbilityBand = "Strong" | "Growing" | "Needs Practice";

export type StudentProfileSummary = {
  identity: {
    course: string;
    unit: string;
    unitTitle: string;
    focus: string;
    preference: string;
  };
  credits: Array<{
    label: string;
    badge: string;
    detail: string;
    level: number;
  }>;
  reviewItems: Array<{
    taskId: string;
    title: string;
    label: "Needs Review" | "Try Again" | "Review Focus";
    focus: string;
    lastResult: string;
  }>;
  accuracy: Array<{
    label: string;
    value: number;
    band: AbilityBand;
    detail: string;
  }>;
  abilities: Array<{
    label: string;
    band: AbilityBand;
    level: number;
    note: string;
  }>;
  thinkingSkills: Array<{
    label: string;
    band: AbilityBand;
    level: number;
    next: string;
  }>;
  strategies: string[];
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
        goalTags: string[];
        studentExplanation: string;
        route: string;
      }
    | undefined;
  recommendedTask: SafeTaskCard | undefined;
  taskCards: SafeTaskCard[];
  progress: SafeProgressSummary;
  studentProfile: StudentProfileSummary;
  simulationNotice: string;
  screenRoutes: typeof SCREEN_ROUTES;
};

export type Runtime = {
  api: InMemoryAdaptLearnMockApi;
};

export const createStudentRuntime = (): Runtime => ({
  api: createInMemoryMockApi(),
});

export const parseRoute = (pathname: string): RouteState => {
  if (pathname === "/student/profile") {
    return { screen: "profile" };
  }

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

  if (pathname === "/student/growth" || pathname === "/student/progress") {
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
      return "/student/progress";
    case "profile":
      return "/student/profile";
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
  const submissions = runtime.api.listSubmissions(student.student_id).data ?? [];
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
      goal: translatePathGoal(activePath.path_id, activePath.goal),
      version: activePath.version,
      status: activePath.status,
      totalMinutes: activePath.steps.reduce((total, step) => total + step.minutes, 0),
      completedCount: taskCards.filter((card) => card.status === "COMPLETED").length,
      totalCount: taskCards.length,
      goalTags: PATH_GOAL_TAGS[activePath.path_id] ?? ["Unit 6"],
      studentExplanation: PATH_STUDENT_EXPLANATIONS[activePath.path_id] ?? "Ready path",
      route: `/student/path/${activePath.path_id}`,
    },
    recommendedTask,
    taskCards,
    progress: buildSafeProgressSummary(profile, runtime.api.fixture.knowledge_nodes, taskCards),
    studentProfile: buildStudentProfileSummary(student, profile, taskCards, submissions),
    simulationNotice: "Prototype data",
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
      title: translateTaskTitle(task),
      module: task.module,
      taskType: translateTaskType(task.task_type),
      prompt: translateTaskPrompt(task),
      responseFormat: translateResponseFormat(task.response_format),
      bloom: translateBloom(task.bloom),
      thinking: translateThinking(task.thinking_primary),
      difficulty: translateDifficulty(task.difficulty),
      minutes: step.minutes,
      status,
      isActionable: status === "AVAILABLE" || status === "IN_PROGRESS" || status === "COMPLETED",
      nodeNames,
      studentReason: explainStepForStudent(step, nodeNames),
      learningStrategies: task.learning_strategy.map(translateStrategy),
      cognitiveStrategies: task.cognitive_strategy.map(translateStrategy),
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
  return node.english_label ?? NODE_LABELS[nodeId] ?? nodeId;
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

const buildStudentProfileSummary = (
  student: Student,
  profile: LearnerProfile,
  taskCards: SafeTaskCard[],
  submissions: StudentSubmission[],
): StudentProfileSummary => {
  const completedPracticeCount = submissions.filter((submission) =>
    ["COMPLETED", "RECEIVED", "REVIEW_PENDING"].includes(submission.status),
  ).length;
  const evidenceCount = submissions.reduce((total, submission) => total + submission.evidence_ids.length, 0);
  const completedTaskCount = Math.max(
    taskCards.filter((task) => task.status === "COMPLETED").length,
    submissions.filter((submission) => submission.status === "COMPLETED").length,
  );
  const totalTaskCount = Math.max(taskCards.length, 1);
  const reflectionCount = taskCards.flatMap((task) => task.learningStrategies).filter((strategy) =>
    /reflection|self-monitoring|check|revise/i.test(strategy),
  ).length;
  const abilityItems = buildAbilityItems(profile);
  const reviewItems = buildReviewItems(taskCards);

  return {
    identity: {
      course: "Grade 7 English",
      unit: "Unit 6",
      unitTitle: "The Power of Plants",
      focus: personaFocusLabel(student.persona_id),
      preference: personaPreferenceLabel(student.persona_id),
    },
    credits: [
      {
        label: "Practice Credits",
        badge: `${Math.max(completedPracticeCount, 1)} earned`,
        detail: "Recent Unit 6 practice",
        level: clampLevel(34 + completedPracticeCount * 18),
      },
      {
        label: "Reflection Credits",
        badge: `${Math.max(reflectionCount, 1)} ready`,
        detail: "Review habits",
        level: clampLevel(36 + reflectionCount * 12),
      },
      {
        label: "Vocabulary Builder",
        badge: abilityItems[0]?.band ?? "Growing",
        detail: "Plant words",
        level: abilityItems[0]?.level ?? 50,
      },
      {
        label: "Evidence Collector",
        badge: evidenceCount > 0 ? "Started" : "Ready",
        detail: "Use proof words",
        level: clampLevel(42 + evidenceCount * 18),
      },
    ],
    reviewItems,
    accuracy: buildAccuracyItems(profile, completedTaskCount, totalTaskCount),
    abilities: abilityItems,
    thinkingSkills: buildThinkingSkills(profile),
    strategies: [
      "Read aloud",
      "Label first, explain next",
      "Use evidence words",
      "Check sequence words",
      "Review key plant vocabulary",
    ],
  };
};

const buildAbilityItems = (profile: LearnerProfile): StudentProfileSummary["abilities"] => [
  {
    label: "Vocabulary Understanding",
    band: bandFromLevel(averageMastery(profile, ["VOC01", "VOC02", "VOC03", "VOC04"])),
    level: averageMastery(profile, ["VOC01", "VOC02", "VOC03", "VOC04"]),
    note: "Plant words",
  },
  {
    label: "Sentence Comprehension",
    band: bandFromLevel(averageMastery(profile, ["TT01", "TT02", "DS03", "DS04"])),
    level: averageMastery(profile, ["TT01", "TT02", "DS03", "DS04"]),
    note: "Meaning in text",
  },
  {
    label: "Reading Sequence",
    band: bandFromLevel(averageMastery(profile, ["DS01", "SR04", "DS09"])),
    level: averageMastery(profile, ["DS01", "SR04", "DS09"]),
    note: "Process steps",
  },
  {
    label: "Evidence Use",
    band: bandFromLevel(profile.thinking_profile.evidence_coverage * 100),
    level: clampLevel(profile.thinking_profile.evidence_coverage * 100),
    note: "Proof words",
  },
  {
    label: "Reflection Quality",
    band: bandFromLevel(averageMastery(profile, ["SW01", "SW03", "SW06"])),
    level: averageMastery(profile, ["SW01", "SW03", "SW06"]),
    note: "Check work",
  },
];

const buildThinkingSkills = (profile: LearnerProfile): StudentProfileSummary["thinkingSkills"] => [
  {
    label: "Observe",
    band: bandFromThinkingLevel(profile.thinking_profile.observation_discrimination),
    level: levelFromThinkingLevel(profile.thinking_profile.observation_discrimination),
    next: "Name what you see.",
  },
  {
    label: "Compare",
    band: bandFromLevel(averageMastery(profile, ["VOC14", "DS08", "CU06"])),
    level: averageMastery(profile, ["VOC14", "DS08", "CU06"]),
    next: "Find same and different.",
  },
  {
    label: "Sequence",
    band: bandFromLevel(averageMastery(profile, ["DS01", "SR04"])),
    level: averageMastery(profile, ["DS01", "SR04"]),
    next: "Use first, next, finally.",
  },
  {
    label: "Explain",
    band: bandFromThinkingLevel(profile.thinking_profile.induction_inference),
    level: levelFromThinkingLevel(profile.thinking_profile.induction_inference),
    next: "Add one reason.",
  },
  {
    label: "Reflect",
    band: bandFromLevel(averageMastery(profile, ["SW06", "LS10", "LS11"])),
    level: averageMastery(profile, ["SW06", "LS10", "LS11"]),
    next: "Check one answer.",
  },
];

const buildAccuracyItems = (
  profile: LearnerProfile,
  completedTaskCount: number,
  totalTaskCount: number,
): StudentProfileSummary["accuracy"] => {
  const vocabulary = averageMastery(profile, ["VOC01", "VOC02", "VOC03", "VOC04"]);
  const readingOrder = averageMastery(profile, ["DS01", "SR04", "DS09"]);
  const evidence = clampLevel(profile.thinking_profile.evidence_coverage * 100);
  const completion = clampLevel((completedTaskCount / totalTaskCount) * 100);
  const overall = clampLevel((vocabulary + readingOrder + evidence + completion) / 4);
  const recent = clampLevel((vocabulary + readingOrder + completion) / 3);

  return [
    { label: "Overall accuracy", value: overall, band: bandFromLevel(overall), detail: "Mock progress" },
    { label: "Recent practice accuracy", value: recent, band: bandFromLevel(recent), detail: "Last Unit 6 tasks" },
    { label: "Vocabulary accuracy", value: vocabulary, band: bandFromLevel(vocabulary), detail: "Plant words" },
    { label: "Reading/order accuracy", value: readingOrder, band: bandFromLevel(readingOrder), detail: "Sequence steps" },
  ];
};

const buildReviewItems = (taskCards: SafeTaskCard[]): StudentProfileSummary["reviewItems"] => {
  const findTaskId = (fallback: string, titlePattern: RegExp) =>
    taskCards.find((task) => titlePattern.test(task.title))?.taskId ?? fallback;

  return [
    {
      taskId: findTaskId("UI01", /parts of a plant/i),
      title: "Label root and stem",
      label: "Needs Review",
      focus: "Vocabulary Understanding",
      lastResult: "Plant words",
    },
    {
      taskId: findTaskId("UI03", /photosynthesis steps/i),
      title: "Put plant growth steps in order",
      label: "Try Again",
      focus: "Reading Sequence",
      lastResult: "Order words",
    },
    {
      taskId: findTaskId("UI04", /best title/i),
      title: "Choose evidence words",
      label: "Review Focus",
      focus: "Evidence Use",
      lastResult: "Proof words",
    },
  ];
};

const averageMastery = (profile: LearnerProfile, nodeIds: string[]): number => {
  const matchingStates = profile.bkt_states.filter((state) => nodeIds.includes(state.node_id));
  if (matchingStates.length === 0) {
    return 48;
  }
  const average =
    matchingStates.reduce((total, state) => total + state.mastery_probability, 0) / matchingStates.length;
  return clampLevel(average * 100);
};

const clampLevel = (value: number): number => Math.min(92, Math.max(24, Math.round(value)));

const bandFromLevel = (level: number): AbilityBand => {
  if (level >= 66) {
    return "Strong";
  }
  if (level >= 48) {
    return "Growing";
  }
  return "Needs Practice";
};

const bandFromThinkingLevel = (value: ThinkingQualityProfile[keyof ThinkingQualityProfile]): AbilityBand => {
  if (value === "EVIDENCE_INSUFFICIENT") {
    return "Needs Practice";
  }
  if (value === "T2" || value === "T3") {
    return "Strong";
  }
  if (value === "T1") {
    return "Growing";
  }
  return "Needs Practice";
};

const levelFromThinkingLevel = (value: ThinkingQualityProfile[keyof ThinkingQualityProfile]): number => {
  if (value === "T3") {
    return 82;
  }
  if (value === "T2") {
    return 70;
  }
  if (value === "T1") {
    return 56;
  }
  return 36;
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
    label: "Observation",
    state: thinkingLevelLabel(thinking.observation_discrimination),
    helper: "Notice evidence.",
  },
  {
    label: "Inference",
    state: thinkingLevelLabel(thinking.induction_inference),
    helper: "Use clues.",
  },
  {
    label: "Creation",
    state: thinkingLevelLabel(thinking.critique_creation),
    helper: "Build a reason.",
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
  return `Focus: ${focus || "Unit 6 skills"}`;
};

const riskToStudentLabel = (risk: Task["review_risk"]): string => {
  if (risk === "\u9ad8") {
    return "Teacher review";
  }
  if (risk === "\u4e2d") {
    return "Teacher check";
  }
  return "Mock feedback";
};

const PATH_GOAL_LABELS: Record<string, string> = {
  PTH01: "Plant vocabulary",
  PTH03: "Reading summary",
  PTH05: "Culture comparison",
};

const PATH_GOAL_TAGS: Record<string, string[]> = {
  PTH01: ["Plant vocabulary", "Process order"],
  PTH03: ["Main idea", "Inference"],
  PTH05: ["Tea culture", "Short paragraph"],
};

const PATH_STUDENT_EXPLANATIONS: Record<string, string> = {
  PTH01: "Ready path",
  PTH03: "Reading path",
  PTH05: "Writing path",
};

const personaFocusLabel = (personaId: string): string => {
  if (personaId === "persona_a") {
    return "Vocabulary foundation";
  }
  if (personaId === "persona_b") {
    return "Reading support";
  }
  if (personaId === "persona_c") {
    return "Writing stretch";
  }
  return "Unit 6 focus";
};

const personaPreferenceLabel = (personaId: string): string => {
  if (personaId === "persona_a") {
    return "Read aloud";
  }
  if (personaId === "persona_b") {
    return "Use evidence words";
  }
  if (personaId === "persona_c") {
    return "Plan, write, revise";
  }
  return "Short focused practice";
};

const TASK_TITLES: Record<string, string> = {
  UI01: "Label the parts of a plant",
  UI02: "Classify photosynthesis inputs and outputs",
  UI03: "Order the photosynthesis steps",
  UI04: "Choose the best title for an explanation",
  UI09: "Summarize a paragraph in one sentence",
  UI10: "Turn a text into a process chart",
  UI16: "Explain a double meaning in the title",
  UI17: "Explain photosynthesis in 45 seconds",
  UI20: "Answer an inference question with evidence",
  RF04: "Sort recent mistakes by cause",
  RW02: "Find details in a Chinese tea story",
  RW03: "Find details in a British tea story",
  RW04: "Compare tea culture with a Venn diagram",
  RW07: "Explain 'more than a drink'",
  RW10: "Give your view on tea as more than a drink",
  RW11: "Plan a paragraph about tea and family",
  RW12: "Write a short paragraph about tea and family",
  RW13: "Check and revise your writing",
};

const TASK_PROMPTS: Record<string, string> = {
  UI01: "Match each plant word to the diagram.",
  UI02: "Sort inputs and outputs.",
  UI03: "Put the steps in order.",
  UI04: "Choose the best title.",
  UI09: "Write one short summary sentence.",
  UI10: "Complete the process chart.",
  UI16: "Explain the double meaning of plant.",
  UI17: "Speak through the process chart.",
  UI20: "Answer with one piece of evidence.",
  RF04: "Sort recent mistakes by cause.",
  RW02: "Find details in a Chinese tea story.",
  RW03: "Find details in a British tea story.",
  RW04: "Compare the two tea stories.",
  RW07: "Explain the tea message.",
  RW10: "Give your view with two details.",
  RW11: "Plan a short paragraph.",
  RW12: "Write the short paragraph.",
  RW13: "Check and revise your writing.",
};

const NODE_LABELS: Record<string, string> = {
  VOC01: "plant parts",
  VOC02: "photosynthesis inputs",
  VOC03: "photosynthesis outputs",
  VOC04: "process verbs",
  VOC09: "tea culture vocabulary",
  VOC14: "comparison and degree expressions",
  DS01: "process sequence",
  DS02: "cause and effect",
  DS03: "main idea and details",
  DS04: "title selection",
  DS06: "context meaning",
  DS07: "double meaning",
  DS08: "comparison structure",
  DS09: "information organization",
  DS11: "short paragraph organization",
  DS12: "evidence-based response",
  PR02: "giving reasons",
  PR05: "polite agreement and disagreement",
  SR01: "locating details",
  SR02: "main idea and title",
  SR04: "process and cause-effect",
  SR05: "cross-text comparison",
  SR06: "evaluating claims",
  SR07: "figurative language",
  SW01: "notes and forms",
  SW03: "process explanation",
  SW04: "personal cultural paragraph",
  SW06: "writing reflection",
  TT01: "expository text",
  TT02: "diagram and infographic",
  TT05: "story text",
  TT07: "personal cultural paragraph",
  CU04: "Chinese tea culture",
  CU05: "British tea culture",
  CU06: "cross-cultural comparison",
  LS03: "selective attention",
  LS05: "diagram organization",
  LS09: "models and scaffolds",
  LS10: "self-monitoring",
  LS11: "reflection and adjustment",
};

const TERM_TRANSLATIONS: Record<string, string> = {
  "\u56fe\u793a\u7ec4\u7ec7": "diagram organization",
  "\u63d0\u53d6\u7ec3\u4e60": "retrieval practice",
  "\u6bd4\u8f83\u5206\u7c7b": "compare and classify",
  "\u7b14\u8bb0\u8bb0\u5f55": "note taking",
  "\u9884\u89c8\u9884\u6d4b": "preview and predict",
  "\u81ea\u6211\u89e3\u91ca": "self-explanation",
  "\u9009\u62e9\u6027\u6ce8\u610f": "selective attention",
  "\u8bed\u5883\u731c\u6d4b": "context guessing",
  "\u8303\u4f8b\u652f\u67b6": "model and scaffold",
  "\u81ea\u6211\u76d1\u63a7": "self-monitoring",
  "\u53cd\u601d\u8c03\u6574": "reflection and adjustment",
  "\u5408\u4f5c\u63a2\u7a76": "collaborative inquiry",
  "\u8bc6\u522b": "identify",
  "\u5339\u914d": "match",
  "\u5206\u7c7b": "classify",
  "\u56e0\u679c\u5206\u6790": "cause-effect analysis",
  "\u6392\u5e8f": "Sequencing",
  "\u4fe1\u606f\u8f6c\u6362": "Information transformation",
  "\u6982\u62ec": "summarize",
  "\u8bc4\u4ef7\u8bba\u8bc1": "evaluate evidence",
  "\u63a8\u65ad": "infer",
  "\u6bd4\u8f83": "compare",
  "\u8fc1\u79fb\u5e94\u7528": "transfer and apply",
  "\u521b\u9020\u751f\u6210": "create",
  "\u76d1\u63a7\u4fee\u6b63": "monitor and revise",
  "\u8bb0\u5fc6": "Remember",
  "\u7406\u89e3": "Understand",
  "\u5e94\u7528": "Apply",
  "\u5206\u6790": "Analyze",
  "\u8bc4\u4ef7": "Evaluate",
  "\u521b\u9020": "Create",
  "\u89c2\u5bdf\u4e0e\u8fa8\u6790": "Observation and discrimination",
  "\u5f52\u7eb3\u4e0e\u63a8\u65ad": "Induction and inference",
  "\u6279\u5224\u4e0e\u521b\u65b0": "Critique and creation",
  "\u975e\u5e38\u5bb9\u6613": "Very easy",
  "\u5bb9\u6613": "Easy",
  "\u4e2d\u7b49": "Medium",
  "\u56f0\u96be": "Hard",
  "\u975e\u5e38\u56f0\u96be": "Very hard",
  "\u56fe\u7247\u89c2\u5bdf": "Picture observation",
  "\u56fe\u7247\u5206\u7c7b": "Picture classification",
  "\u53d7\u63a7\u53e3\u8bed": "Guided speaking",
  "\u89c2\u70b9\u7406\u7531": "Opinion with reasons",
  "\u9884\u6d4b\u4efb\u52a1": "Prediction task",
  "\u89c6\u9891\u7406\u89e3": "Video comprehension",
  "\u89c6\u9891\u77ed\u7b54": "Video short answer",
  "\u76ee\u6807\u8bbe\u5b9a": "Goal setting",
  "\u8bcd\u56fe\u5339\u914d": "Word-picture matching",
  "\u5206\u7c7b\u9898": "Sorting task",
  "\u6d41\u7a0b\u6392\u5e8f": "Process sequencing",
  "\u6807\u9898\u9009\u62e9": "Title choice",
  "\u6bb5\u843d\u6458\u8981": "Paragraph summary",
  "\u5f00\u653e\u77ed\u7b54": "Open short answer",
  "\u53e3\u5934\u590d\u8ff0": "Oral retelling",
  "\u8bc1\u636e\u77ed\u7b54": "Evidence short answer",
  "\u9519\u8bef\u53cd\u601d": "Mistake reflection",
  "\u9605\u8bfb\u7ec6\u8282": "Reading for details",
  "\u8de8\u6587\u672c\u6bd4\u8f83": "Cross-text comparison",
  "\u8868\u8fbe\u89e3\u91ca": "Expression explanation",
  "\u89c2\u70b9\u8bba\u8bc1": "Opinion argument",
  "\u5199\u524d\u89c4\u5212": "Writing plan",
  "\u77ed\u5199\u4f5c": "Short writing",
  "\u68c0\u67e5\u8868": "Checklist",
  "\u62d6\u62fd\u6807\u6ce8": "Drag-and-drop labels",
  "\u62d6\u62fd\u5206\u7c7b": "Drag-and-drop sorting",
  "\u5355\u9009+\u77ed\u7b54": "Single choice and short answer",
  "\u4e00\u53e5\u8bdd\u6458\u8981": "One-sentence summary",
  "\u7ed3\u6784\u5316\u8868\u683c": "Structured table",
  "80\u5b57\u5185": "Up to 80 words",
  "\u53e3\u8bed\u5f55\u97f3": "Audio recording",
  "\u77ed\u7b54": "Short answer",
  "\u5206\u7c7b+\u77ed\u7b54": "Classification and short answer",
  "\u8868\u683c": "Table",
  "Venn\u56fe": "Venn diagram",
  "80\u2013100\u5b57": "80-100 words",
  "\u5199\u4f5c\u63d0\u7eb2": "Writing outline",
  "\u77ed\u6587": "Short paragraph",
  "\u68c0\u67e5\u8868+\u4fee\u8ba2": "Checklist and revision",
};

const HAN_TEXT_PATTERN = /\p{Script=Han}/u;

const translatePathGoal = (pathId: string, fallback: string): string =>
  PATH_GOAL_LABELS[pathId] ?? safeEnglishFallback(fallback, "Unit 6 learning path");

const translateTaskTitle = (task: Task): string => TASK_TITLES[task.task_id] ?? `Unit 6 task ${task.task_id}`;

const translateTaskPrompt = (task: Task): string =>
  TASK_PROMPTS[task.task_id] ?? safeEnglishFallback(task.student_prompt, "Complete this Unit 6 practice task.");

const translateTaskType = (taskType: string): string => translateTerm(taskType);

const translateResponseFormat = (responseFormat: string): string => translateTerm(responseFormat);

const translateBloom = (bloom: string): string => bloom.split("|").map(translateTerm).join(" / ");

const translateThinking = (thinking: string): string => translateTerm(thinking);

const translateDifficulty = (difficulty: string): string => translateTerm(difficulty);

const translateStrategy = (strategy: string): string => translateTerm(strategy);

const translateTerm = (value: string): string =>
  TERM_TRANSLATIONS[value] ?? safeEnglishFallback(value, "Unit 6 learning item");

const safeEnglishFallback = (value: string, fallback: string): string => {
  if (HAN_TEXT_PATTERN.test(value)) {
    return fallback;
  }
  return value;
};
