import {
  ArrowLeft,
  Award,
  BarChart3,
  BadgeCheck,
  BookOpenCheck,
  Brain,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Home,
  Info,
  Leaf,
  Lightbulb,
  LockKeyhole,
  Mic,
  Pencil,
  RefreshCw,
  Route,
  Send,
  Sprout,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  buildStudentExperience,
  COURSE_OPTIONS,
  createStudentRuntime,
  markTaskCompleteAndUnlockNext,
  parseRoute,
  routeToPath,
  submitMockTask,
  type CourseId,
  type RouteState,
  type SafeTaskCard,
  type StepOverrideMap,
  type StudentExperience,
  type StudentProfileSummary,
  type StudentId,
} from "./lib/adaptlearn";

type LastFeedback = {
  taskId: string;
  title: string;
  submissionStatus: string;
  correctCount: number;
  totalCount: number;
  resultText: string;
};

type PlantLabelKey = "root" | "stem" | "leaf" | "seed";
type ClassificationTermKey = "sunlight" | "water" | "carbonDioxide" | "oxygen" | "glucose" | "chlorophyll";
type ClassificationZoneKey = "inputs" | "outputs" | "helps";
type ClassificationAnswer = Record<ClassificationTermKey, ClassificationZoneKey | "">;
type ProcessStepKey = "water" | "carbon" | "sunlight" | "glucose" | "oxygen";
type AnalyzeChoiceKey = "glucose" | "oxygen" | "growth" | "water";
type ExplanationChoiceKey = "strong" | "soil" | "green";
type EvaluationReasonKey = "evidence" | "sequence" | "causeEffect" | "missingVocabulary";
type RecordingState = "idle" | "recording" | "saved";

const labelOptions: PlantLabelKey[] = ["root", "stem", "leaf", "seed"];
const plantTargets: Array<{ key: PlantLabelKey; label: string; helper: string }> = [
  { key: "leaf", label: "A", helper: "green flat part" },
  { key: "stem", label: "B", helper: "supports the plant" },
  { key: "seed", label: "C", helper: "new plant starter" },
  { key: "root", label: "D", helper: "under the soil" },
];

const classificationTerms: Array<{ key: ClassificationTermKey; label: string; shortLabel: string }> = [
  { key: "sunlight", label: "sunlight", shortLabel: "sun" },
  { key: "water", label: "water", shortLabel: "H2O" },
  { key: "carbonDioxide", label: "carbon dioxide", shortLabel: "CO2" },
  { key: "oxygen", label: "oxygen", shortLabel: "O2" },
  { key: "glucose", label: "glucose", shortLabel: "food" },
  { key: "chlorophyll", label: "chlorophyll", shortLabel: "green" },
];

const classificationZones: Array<{ key: ClassificationZoneKey; label: string }> = [
  { key: "inputs", label: "Inputs" },
  { key: "outputs", label: "Outputs" },
  { key: "helps", label: "Helps the process" },
];

const expectedClassification: Record<ClassificationTermKey, ClassificationZoneKey> = {
  sunlight: "inputs",
  water: "inputs",
  carbonDioxide: "inputs",
  oxygen: "outputs",
  glucose: "outputs",
  chlorophyll: "helps",
};

const processSteps: Array<{ key: ProcessStepKey; label: string }> = [
  { key: "water", label: "Roots take in water" },
  { key: "carbon", label: "Leaves take in carbon dioxide" },
  { key: "sunlight", label: "Sunlight gives energy" },
  { key: "glucose", label: "Leaves make glucose" },
  { key: "oxygen", label: "Oxygen is released" },
];

const analyzeOptions: Array<{ key: AnalyzeChoiceKey; label: string; detail: string }> = [
  { key: "glucose", label: "Less glucose", detail: "Sunlight gives energy to make food." },
  { key: "oxygen", label: "Less oxygen", detail: "Oxygen is released after food is made." },
  { key: "growth", label: "Slower growth", detail: "The plant has less food for growth." },
  { key: "water", label: "Water disappears", detail: "Water is still taken in by roots." },
];

const explanationOptions: Array<{ key: ExplanationChoiceKey; label: string }> = [
  {
    key: "strong",
    label: "Plants use water, carbon dioxide, and sunlight to make glucose. Oxygen is released.",
  },
  {
    key: "soil",
    label: "Plants eat soil and turn it into oxygen when the sun is bright.",
  },
  {
    key: "green",
    label: "Leaves make oxygen because plants are green.",
  },
];

const evaluationReasons: Array<{ key: EvaluationReasonKey; label: string }> = [
  { key: "evidence", label: "uses evidence" },
  { key: "sequence", label: "includes correct sequence" },
  { key: "causeEffect", label: "explains cause and effect" },
  { key: "missingVocabulary", label: "missing key vocabulary" },
];

export function App() {
  const runtimeRef = useRef(createStudentRuntime());
  const studentId: StudentId = "stu_persona_a";
  const [courseId, setCourseId] = useState<CourseId>("grade7_english");
  const [route, setRoute] = useState<RouteState>(() => parseRoute(window.location.pathname));
  const [stepOverrides, setStepOverrides] = useState<StepOverrideMap>({});
  const [answers, setAnswers] = useState<Record<PlantLabelKey, string>>({
    root: "",
    stem: "",
    leaf: "",
    seed: "",
  });
  const [showHint, setShowHint] = useState(false);
  const [classification, setClassification] = useState<ClassificationAnswer>({
    sunlight: "",
    water: "",
    carbonDioxide: "",
    oxygen: "",
    glucose: "",
    chlorophyll: "",
  });
  const [processOrder, setProcessOrder] = useState<ProcessStepKey[]>([]);
  const [analyzeChoices, setAnalyzeChoices] = useState<AnalyzeChoiceKey[]>([]);
  const [evaluateChoice, setEvaluateChoice] = useState<ExplanationChoiceKey | "">("");
  const [evaluateReason, setEvaluateReason] = useState<EvaluationReasonKey | "">("");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [lastFeedback, setLastFeedback] = useState<LastFeedback | undefined>();
  const [reflection, setReflection] = useState("");
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);
  const [difficulty, setDifficulty] = useState("Just right");
  const screenScrollRef = useRef<HTMLElement | null>(null);
  const currentPath = routeToPath(route);

  const experience = useMemo(
    () => buildStudentExperience(runtimeRef.current, studentId, stepOverrides),
    [studentId, stepOverrides],
  );

  useLayoutEffect(() => {
    if (screenScrollRef.current) {
      screenScrollRef.current.scrollTop = 0;
      screenScrollRef.current.scrollLeft = 0;
    }
  }, [currentPath]);

  useEffect(() => {
    const handlePopState = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextRoute: RouteState) => {
    const nextPath = routeToPath(nextRoute);
    if (screenScrollRef.current) {
      screenScrollRef.current.scrollTop = 0;
      screenScrollRef.current.scrollLeft = 0;
    }
    window.history.pushState(null, "", nextPath);
    setRoute(nextRoute);
  };

  const handleCompleteTask = (task: SafeTaskCard) => {
    if (!experience.activePath) {
      return;
    }

    const snapshot = buildTaskSnapshot({
      task,
      answers,
      classification,
      processOrder,
      analyzeChoices,
      evaluateChoice,
      evaluateReason,
      recordingState,
    });
    const submission = submitMockTask(runtimeRef.current, {
      learnerId: experience.student.student_id,
      taskId: task.taskId,
      pathId: experience.activePath.pathId,
      pathVersion: experience.activePath.version,
      offline: false,
    });
    const nextOverrides = markTaskCompleteAndUnlockNext(experience.taskCards, task.taskId);
    setStepOverrides((current) => ({ ...current, ...nextOverrides }));
    setLastFeedback({
      taskId: task.taskId,
      title: task.title,
      submissionStatus: submission.status,
      correctCount: snapshot.correctCount,
      totalCount: snapshot.totalCount,
      resultText: snapshot.resultText,
    });
    navigate({ screen: "feedback", taskId: task.taskId });
  };

  const updateReflection = (value: string) => {
    setReflection(value);
    setReflectionSubmitted(false);
  };

  const activeTask =
    route.screen === "task" || route.screen === "feedback"
      ? experience.taskCards.find((task) => task.taskId === route.taskId) ?? experience.recommendedTask
      : experience.recommendedTask;

  return (
    <main className="stage">
      <div className="phone-shell" aria-label="AdaptLearn Copilot student prototype">
        <div className="phone-chrome">
          <div className="status-bar" aria-hidden="true">
            <span>9:41</span>
            <span className="status-icons">●●● 5G ▰</span>
          </div>
          {route.screen === "task" ? (
            <TaskTopBar task={activeTask} experience={experience} navigate={navigate} />
          ) : (
            <StudentHeader selectedCourseId={courseId} onCourseChange={setCourseId} />
          )}
        </div>

        <section ref={screenScrollRef} className="screen-scroll" aria-live="polite">
          {route.screen === "home" && <HomeScreen experience={experience} navigate={navigate} />}
          {route.screen === "path" && <PathScreen experience={experience} navigate={navigate} />}
          {route.screen === "task" && activeTask && (
            <TaskScreen
              task={activeTask}
              answers={answers}
              setAnswers={setAnswers}
              showHint={showHint}
              setShowHint={setShowHint}
              classification={classification}
              setClassification={setClassification}
              processOrder={processOrder}
              setProcessOrder={setProcessOrder}
              analyzeChoices={analyzeChoices}
              setAnalyzeChoices={setAnalyzeChoices}
              evaluateChoice={evaluateChoice}
              setEvaluateChoice={setEvaluateChoice}
              evaluateReason={evaluateReason}
              setEvaluateReason={setEvaluateReason}
              recordingState={recordingState}
              setRecordingState={setRecordingState}
              onComplete={handleCompleteTask}
            />
          )}
          {route.screen === "feedback" && activeTask && (
            <FeedbackScreen
              experience={experience}
              task={activeTask}
              lastFeedback={lastFeedback}
              reflection={reflection}
              setReflection={updateReflection}
              reflectionSubmitted={reflectionSubmitted}
              onReflectionSubmit={() => setReflectionSubmitted(true)}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              navigate={navigate}
            />
          )}
          {route.screen === "growth" && (
            <ProgressScreen
              experience={experience}
              reflection={reflection}
              setReflection={updateReflection}
              reflectionSubmitted={reflectionSubmitted}
              onReflectionSubmit={() => setReflectionSubmitted(true)}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              navigate={navigate}
            />
          )}
          {route.screen === "profile" && <ProfileScreen experience={experience} navigate={navigate} />}
        </section>

        <BottomNav route={route} experience={experience} navigate={navigate} />
      </div>
    </main>
  );
}

function StudentHeader({
  selectedCourseId,
  onCourseChange,
}: {
  selectedCourseId: CourseId;
  onCourseChange: (courseId: CourseId) => void;
}) {
  return (
    <header className="student-header">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">
          <Sprout size={24} />
        </span>
        <div>
          <strong>AdaptLearn</strong>
          <span>Copilot Student</span>
        </div>
      </div>
      <label className="course-picker">
        <span className="course-icon" aria-hidden="true">
          <BookOpenCheck size={18} />
        </span>
        <span className="sr-only">Choose course</span>
        <select value={selectedCourseId} onChange={(event) => onCourseChange(event.target.value as CourseId)}>
          {COURSE_OPTIONS.map((course) => (
            <option key={course.id} value={course.id}>
              {course.label}
            </option>
          ))}
        </select>
      </label>
    </header>
  );
}

function HomeScreen({ experience, navigate }: { experience: StudentExperience; navigate: (route: RouteState) => void }) {
  const path = experience.activePath;
  const task = experience.recommendedTask;

  return (
    <div className="screen-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Grade 7 English</p>
          <span className="unit-badge">Unit 6</span>
          <h1>The Power of Plants</h1>
        </div>
        <PlantMiniScene />
      </section>

      <section className="summary-band home-quick-grid" aria-label="Today summary">
        <div>
          <span className="small-label">Today</span>
          <strong>Plant process</strong>
          <p>Unit 6 task</p>
        </div>
        <div>
          <span className="small-label">Deadline</span>
          <strong>
            <Clock3 size={17} />
            Due Today
          </strong>
          <p>Finish by 18:00</p>
        </div>
        <div>
          <span className="small-label">Credits</span>
          <strong>{experience.studentProfile.creditTotal}</strong>
          <p>Mock progress</p>
        </div>
      </section>

      {path && (
        <section className="path-hero">
          <div className="section-title-row">
            <div>
              <span className="small-label">Your Learning Path</span>
              <h2>{path.completedCount} of {path.totalCount} tasks complete</h2>
            </div>
            <button className="icon-button" aria-label="View learning path" onClick={() => navigate({ screen: "path", pathId: path.pathId })}>
              <ChevronRight size={20} />
            </button>
          </div>
          <ProgressRail completed={path.completedCount} total={path.totalCount} />
          <div className="path-meta-grid">
            <span><Clock3 size={16} /> {path.totalMinutes} min</span>
            <span><BookOpenCheck size={16} /> {formatPathStatus(path.status)}</span>
            <span><ClipboardCheck size={16} /> {path.totalCount} steps</span>
          </div>
        </section>
      )}

      {task && (
        <section className="task-feature">
          <div className="section-title-row">
            <div>
              <span className="small-label">Today's Task</span>
              <h2>{task.title}</h2>
            </div>
            <span className="step-pill">Step {task.stepNo}</span>
          </div>
          <div className="task-feature-body">
            <PlantCardArt />
            <div>
              <div className="chip-row">
                <span className="chip">{task.bloom}</span>
                <span className="chip">{task.minutes} min</span>
                <span className="chip"><Clock3 size={15} /> Due Today</span>
              </div>
              <button
                className="primary-button"
                onClick={() => navigate({ screen: "task", taskId: task.taskId })}
                disabled={!task.isActionable}
              >
                <Leaf size={18} />
                Start
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function PathScreen({ experience, navigate }: { experience: StudentExperience; navigate: (route: RouteState) => void }) {
  const path = experience.activePath;

  if (!path) {
    return <EmptyState title="No student path available" body="Only valid published paths can appear here." />;
  }

  return (
    <div className="screen-stack">
      <section className="path-intro">
        <span className="small-label">Unit 6 Learning Path</span>
        <h1>{path.goal}</h1>
        <div className="path-meta-grid">
          <span><Clock3 size={16} /> {path.totalMinutes} min</span>
          <span><ClipboardCheck size={16} /> {path.totalCount} tasks</span>
          <span><Check size={16} /> {formatPathStatus(path.status)}</span>
          <span>Prototype</span>
        </div>
      </section>
      <section className="timeline" aria-label="Learning path task timeline">
        {experience.taskCards.map((task) => (
          <PathTaskCard key={task.taskId} task={task} navigate={navigate} />
        ))}
      </section>
    </div>
  );
}

function PathTaskCard({ task, navigate }: { task: SafeTaskCard; navigate: (route: RouteState) => void }) {
  const isLocked = task.status === "LOCKED";
  return (
    <article className={`path-task ${task.status.toLowerCase()}`}>
      <div className="timeline-marker" aria-hidden="true">
        {task.status === "COMPLETED" ? <Check size={18} /> : isLocked ? <LockKeyhole size={17} /> : task.stepNo}
      </div>
      <div className="path-task-body">
        <div className="section-title-row">
          <div>
            <span className="small-label">Step {task.stepNo} · {task.bloom}</span>
            <h2>{task.title}</h2>
          </div>
          <StatusPill status={task.status} />
        </div>
        <div className="chip-row">
          <span className="step-pill">{task.bloom}</span>
          <span className="chip">{task.nodeNames[0] ?? "Vocabulary"}</span>
          <span className="chip">{task.taskType}</span>
          <span className="chip">{task.minutes} min</span>
        </div>
        <ul className="knowledge-list">
          {task.nodeNames.map((node) => (
            <li key={node}>{node}</li>
          ))}
        </ul>
        <button
          className={isLocked ? "secondary-button muted" : "secondary-button"}
          disabled={isLocked}
          onClick={() => navigate({ screen: "task", taskId: task.taskId })}
        >
          {isLocked ? <LockKeyhole size={17} /> : <ChevronRight size={17} />}
          {isLocked ? "Locked" : "Start"}
        </button>
      </div>
    </article>
  );
}

function TaskScreen({
  task,
  answers,
  setAnswers,
  showHint,
  setShowHint,
  classification,
  setClassification,
  processOrder,
  setProcessOrder,
  analyzeChoices,
  setAnalyzeChoices,
  evaluateChoice,
  setEvaluateChoice,
  evaluateReason,
  setEvaluateReason,
  recordingState,
  setRecordingState,
  onComplete,
}: {
  task: SafeTaskCard;
  answers: Record<PlantLabelKey, string>;
  setAnswers: (answers: Record<PlantLabelKey, string>) => void;
  showHint: boolean;
  setShowHint: (value: boolean) => void;
  classification: ClassificationAnswer;
  setClassification: (answers: ClassificationAnswer) => void;
  processOrder: ProcessStepKey[];
  setProcessOrder: (order: ProcessStepKey[]) => void;
  analyzeChoices: AnalyzeChoiceKey[];
  setAnalyzeChoices: (choices: AnalyzeChoiceKey[]) => void;
  evaluateChoice: ExplanationChoiceKey | "";
  setEvaluateChoice: (choice: ExplanationChoiceKey | "") => void;
  evaluateReason: EvaluationReasonKey | "";
  setEvaluateReason: (reason: EvaluationReasonKey | "") => void;
  recordingState: RecordingState;
  setRecordingState: (state: RecordingState) => void;
  onComplete: (task: SafeTaskCard) => void;
}) {
  return (
    <div className="screen-stack task-screen">
      <SimulationNotice />
      <section className="task-prompt">
        <span className="small-label">{task.module} · {task.taskType}</span>
        <h1>{task.title}</h1>
        <p>{task.prompt}</p>
        <div className="chip-row">
          <span className="chip">Step {task.stepNo}</span>
          <span className="chip">{task.bloom}</span>
          <span className="chip">{task.minutes} min</span>
          <span className="chip">{task.responseFormat}</span>
        </div>
      </section>

      <TaskInteraction
        task={task}
        answers={answers}
        setAnswers={setAnswers}
        showHint={showHint}
        setShowHint={setShowHint}
        classification={classification}
        setClassification={setClassification}
        processOrder={processOrder}
        setProcessOrder={setProcessOrder}
        analyzeChoices={analyzeChoices}
        setAnalyzeChoices={setAnalyzeChoices}
        evaluateChoice={evaluateChoice}
        setEvaluateChoice={setEvaluateChoice}
        evaluateReason={evaluateReason}
        setEvaluateReason={setEvaluateReason}
        recordingState={recordingState}
        setRecordingState={setRecordingState}
      />

      <button className="primary-button full-width" onClick={() => onComplete(task)}>
        <Send size={18} />
        Complete task
      </button>
    </div>
  );
}

function TaskInteraction({
  task,
  answers,
  setAnswers,
  showHint,
  setShowHint,
  classification,
  setClassification,
  processOrder,
  setProcessOrder,
  analyzeChoices,
  setAnalyzeChoices,
  evaluateChoice,
  setEvaluateChoice,
  evaluateReason,
  setEvaluateReason,
  recordingState,
  setRecordingState,
}: {
  task: SafeTaskCard;
  answers: Record<PlantLabelKey, string>;
  setAnswers: (answers: Record<PlantLabelKey, string>) => void;
  showHint: boolean;
  setShowHint: (value: boolean) => void;
  classification: ClassificationAnswer;
  setClassification: (answers: ClassificationAnswer) => void;
  processOrder: ProcessStepKey[];
  setProcessOrder: (order: ProcessStepKey[]) => void;
  analyzeChoices: AnalyzeChoiceKey[];
  setAnalyzeChoices: (choices: AnalyzeChoiceKey[]) => void;
  evaluateChoice: ExplanationChoiceKey | "";
  setEvaluateChoice: (choice: ExplanationChoiceKey | "") => void;
  evaluateReason: EvaluationReasonKey | "";
  setEvaluateReason: (reason: EvaluationReasonKey | "") => void;
  recordingState: RecordingState;
  setRecordingState: (state: RecordingState) => void;
}) {
  if (task.taskId === "UI02") {
    return <ClassifyInputsTask classification={classification} setClassification={setClassification} />;
  }

  if (task.taskId === "UI03") {
    return <BuildProcessTask processOrder={processOrder} setProcessOrder={setProcessOrder} />;
  }

  if (task.taskId === "UI08") {
    return <AnalyzeSunlightTask analyzeChoices={analyzeChoices} setAnalyzeChoices={setAnalyzeChoices} />;
  }

  if (task.taskId === "UI04") {
    return (
      <EvaluateExplanationTask
        evaluateChoice={evaluateChoice}
        setEvaluateChoice={setEvaluateChoice}
        evaluateReason={evaluateReason}
        setEvaluateReason={setEvaluateReason}
      />
    );
  }

  if (task.taskId === "UI17") {
    return <OralRetellingTask recordingState={recordingState} setRecordingState={setRecordingState} />;
  }

  return (
    <PlantLabelTask
      answers={answers}
      setAnswers={setAnswers}
      showHint={showHint}
      setShowHint={setShowHint}
    />
  );
}

function PlantLabelTask({
  answers,
  setAnswers,
  showHint,
  setShowHint,
}: {
  answers: Record<PlantLabelKey, string>;
  setAnswers: (answers: Record<PlantLabelKey, string>) => void;
  showHint: boolean;
  setShowHint: (value: boolean) => void;
}) {
  const answeredCount = plantTargets.filter((target) => answers[target.key]).length;
  const correctCount = plantTargets.filter((target) => answers[target.key] === target.key).length;

  return (
    <section className="practice-panel">
      <PlantDiagram />
      <div className="answer-grid" aria-label="Plant part label answers">
        {plantTargets.map((target) => (
          <label key={target.key} className="answer-slot">
            <span>
              {target.label}. {target.helper}
            </span>
            <select
              value={answers[target.key]}
              onChange={(event) =>
                setAnswers({
                  ...answers,
                  [target.key]: event.target.value,
                })
              }
            >
              <option value="">Choose label</option>
              {labelOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="task-actions">
        <button className="secondary-button" onClick={() => setAnswers({ root: "", stem: "", leaf: "", seed: "" })}>
          <RefreshCw size={17} />
          Reset
        </button>
        <button className="secondary-button" onClick={() => setShowHint(!showHint)}>
          <Lightbulb size={17} />
          Hint
        </button>
      </div>
      {showHint && <div className="hint-box">Roots are below the soil. Leaves are on the sides.</div>}
      <div className="feedback-meter">
        <span>
          {answeredCount} of {plantTargets.length} labels selected
        </span>
        <span>{correctCount} match</span>
      </div>
    </section>
  );
}

function ClassifyInputsTask({
  classification,
  setClassification,
}: {
  classification: ClassificationAnswer;
  setClassification: (answers: ClassificationAnswer) => void;
}) {
  return (
    <section className="practice-panel">
      <div className="section-title-row">
        <h2>Sort the cards</h2>
        <Leaf size={18} />
      </div>
      <div className="classification-grid" aria-label="Photosynthesis classification cards">
        {classificationTerms.map((term) => (
          <article key={term.key} className="classification-card">
            <div className={`term-icon ${term.key}`} aria-hidden="true">
              {term.shortLabel}
            </div>
            <strong>{term.label}</strong>
            <div className="mini-choice-row">
              {classificationZones.map((zone) => (
                <button
                  key={zone.key}
                  type="button"
                  className={classification[term.key] === zone.key ? "selected" : ""}
                  onClick={() => setClassification({ ...classification, [term.key]: zone.key })}
                >
                  {zone.label}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="sort-zone-grid" aria-label="Selected groups">
        {classificationZones.map((zone) => (
          <article key={zone.key}>
            <strong>{zone.label}</strong>
            <span>
              {classificationTerms
                .filter((term) => classification[term.key] === zone.key)
                .map((term) => term.label)
                .join(", ") || "Choose cards"}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

function BuildProcessTask({
  processOrder,
  setProcessOrder,
}: {
  processOrder: ProcessStepKey[];
  setProcessOrder: (order: ProcessStepKey[]) => void;
}) {
  const remainingSteps = processSteps.filter((step) => !processOrder.includes(step.key));

  return (
    <section className="practice-panel">
      <div className="section-title-row">
        <h2>Build the sequence</h2>
        <Route size={18} />
      </div>
      <div className="sequence-track" aria-label="Chosen photosynthesis sequence">
        {Array.from({ length: processSteps.length }, (_, index) => {
          const chosen = processSteps.find((step) => step.key === processOrder[index]);
          return (
            <div key={index} className={chosen ? "sequence-slot filled" : "sequence-slot"}>
              <span>{index + 1}</span>
              <strong>{chosen?.label ?? "Choose a step"}</strong>
            </div>
          );
        })}
      </div>
      <div className="sequence-card-grid">
        {remainingSteps.map((step) => (
          <button key={step.key} type="button" onClick={() => setProcessOrder([...processOrder, step.key])}>
            <CircleNumber value={processOrder.length + 1} />
            {step.label}
          </button>
        ))}
      </div>
      <button className="secondary-button compact-button" type="button" onClick={() => setProcessOrder([])}>
        <RefreshCw size={15} />
        Reset order
      </button>
    </section>
  );
}

function AnalyzeSunlightTask({
  analyzeChoices,
  setAnalyzeChoices,
}: {
  analyzeChoices: AnalyzeChoiceKey[];
  setAnalyzeChoices: (choices: AnalyzeChoiceKey[]) => void;
}) {
  const toggleChoice = (choice: AnalyzeChoiceKey) => {
    setAnalyzeChoices(
      analyzeChoices.includes(choice)
        ? analyzeChoices.filter((selected) => selected !== choice)
        : [...analyzeChoices, choice],
    );
  };

  return (
    <section className="practice-panel">
      <div className="scenario-card">
        <PlantMiniScene />
        <div>
          <span className="small-label">Scenario</span>
          <strong>Sunlight is missing</strong>
          <p>Choose what changes. Use because words.</p>
        </div>
      </div>
      <div className="cause-effect-grid" aria-label="Cause and effect choices">
        {analyzeOptions.map((option) => (
          <button
            key={option.key}
            className={analyzeChoices.includes(option.key) ? "selected" : ""}
            type="button"
            onClick={() => toggleChoice(option.key)}
          >
            <strong>{option.label}</strong>
            <span>{option.detail}</span>
          </button>
        ))}
      </div>
      <div className="because-strip">
        <span>because</span>
        <span>energy</span>
        <span>make glucose</span>
        <span>release oxygen</span>
      </div>
    </section>
  );
}

function EvaluateExplanationTask({
  evaluateChoice,
  setEvaluateChoice,
  evaluateReason,
  setEvaluateReason,
}: {
  evaluateChoice: ExplanationChoiceKey | "";
  setEvaluateChoice: (choice: ExplanationChoiceKey | "") => void;
  evaluateReason: EvaluationReasonKey | "";
  setEvaluateReason: (reason: EvaluationReasonKey | "") => void;
}) {
  return (
    <section className="practice-panel">
      <div className="section-title-row">
        <h2>Choose the strongest explanation</h2>
        <BadgeCheck size={18} />
      </div>
      <div className="explanation-list" aria-label="Student explanation choices">
        {explanationOptions.map((option) => (
          <button
            key={option.key}
            className={evaluateChoice === option.key ? "selected" : ""}
            type="button"
            onClick={() => setEvaluateChoice(option.key)}
          >
            <span>{option.label}</span>
          </button>
        ))}
      </div>
      <div className="reason-chip-grid" aria-label="Reason choices">
        {evaluationReasons.map((reason) => (
          <button
            key={reason.key}
            className={evaluateReason === reason.key ? "selected" : ""}
            type="button"
            onClick={() => setEvaluateReason(reason.key)}
          >
            {reason.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function OralRetellingTask({
  recordingState,
  setRecordingState,
}: {
  recordingState: RecordingState;
  setRecordingState: (state: RecordingState) => void;
}) {
  const isRecording = recordingState === "recording";

  return (
    <section className="practice-panel oral-panel">
      <div className="oral-card">
        <button
          className={isRecording ? "mic-button recording" : "mic-button"}
          type="button"
          aria-label={isRecording ? "Stop recording" : "Start recording"}
          onClick={() => setRecordingState(isRecording ? "saved" : "recording")}
        >
          <Mic size={28} />
        </button>
        <div>
          <span className="small-label">Prototype voice</span>
          <h2>Retell photosynthesis</h2>
          <p>Use first, then, next, finally.</p>
        </div>
      </div>
      <button
        className={isRecording ? "primary-button recording-button" : "primary-button recording-button"}
        type="button"
        onClick={() => setRecordingState(isRecording ? "saved" : "recording")}
      >
        <Mic size={18} />
        {isRecording ? "Stop recording" : "Start recording"}
      </button>
      <div className={isRecording ? "waveform active" : "waveform"} aria-label="Simulated recording waveform">
        {Array.from({ length: 12 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
      <div className="hint-box">
        {recordingState === "saved" ? "Recording saved in this prototype." : "No real audio is captured."}
      </div>
    </section>
  );
}

function CircleNumber({ value }: { value: number }) {
  return <span className="circle-number">{value}</span>;
}

function buildTaskSnapshot({
  task,
  answers,
  classification,
  processOrder,
  analyzeChoices,
  evaluateChoice,
  evaluateReason,
  recordingState,
}: {
  task: SafeTaskCard;
  answers: Record<PlantLabelKey, string>;
  classification: ClassificationAnswer;
  processOrder: ProcessStepKey[];
  analyzeChoices: AnalyzeChoiceKey[];
  evaluateChoice: ExplanationChoiceKey | "";
  evaluateReason: EvaluationReasonKey | "";
  recordingState: RecordingState;
}): Pick<LastFeedback, "correctCount" | "totalCount" | "resultText"> {
  if (task.taskId === "UI02") {
    const placedCount = classificationTerms.filter((term) => classification[term.key]).length;
    const matchedCount = classificationTerms.filter((term) => classification[term.key] === expectedClassification[term.key]).length;
    return {
      correctCount: matchedCount,
      totalCount: classificationTerms.length,
      resultText: `${placedCount} of ${classificationTerms.length} cards placed`,
    };
  }

  if (task.taskId === "UI03") {
    const matchedCount = processSteps.filter((step, index) => processOrder[index] === step.key).length;
    return {
      correctCount: matchedCount,
      totalCount: processSteps.length,
      resultText: `${processOrder.length} of ${processSteps.length} steps placed`,
    };
  }

  if (task.taskId === "UI08") {
    const evidenceChoices: AnalyzeChoiceKey[] = ["glucose", "oxygen", "growth"];
    const matchedCount = analyzeChoices.filter((choice) => evidenceChoices.includes(choice)).length;
    return {
      correctCount: matchedCount,
      totalCount: evidenceChoices.length,
      resultText: `${analyzeChoices.length} effects chosen`,
    };
  }

  if (task.taskId === "UI04") {
    return {
      correctCount: Number(evaluateChoice === "strong") + Number(Boolean(evaluateReason)),
      totalCount: 2,
      resultText: evaluateChoice && evaluateReason ? "Choice and reason saved" : "Choice saved",
    };
  }

  if (task.taskId === "UI17") {
    const hasRecording = recordingState === "recording" || recordingState === "saved";
    return {
      correctCount: hasRecording ? 1 : 0,
      totalCount: 1,
      resultText: hasRecording ? "Retelling draft saved" : "Retelling ready",
    };
  }

  const selectedCount = plantTargets.filter((target) => answers[target.key]).length;
  const matchedCount = plantTargets.filter((target) => answers[target.key] === target.key).length;
  return {
    correctCount: matchedCount,
    totalCount: plantTargets.length,
    resultText: `${selectedCount} of ${plantTargets.length} labels selected`,
  };
}

function FeedbackScreen({
  experience,
  task,
  lastFeedback,
  reflection,
  setReflection,
  reflectionSubmitted,
  onReflectionSubmit,
  difficulty,
  setDifficulty,
  navigate,
}: {
  experience: StudentExperience;
  task: SafeTaskCard;
  lastFeedback: LastFeedback | undefined;
  reflection: string;
  setReflection: (value: string) => void;
  reflectionSubmitted: boolean;
  onReflectionSubmit: () => void;
  difficulty: string;
  setDifficulty: (value: string) => void;
  navigate: (route: RouteState) => void;
}) {
  return (
    <div className="screen-stack">
      <section className="feedback-hero">
        <Trophy size={30} />
        <div>
          <span className="small-label">Practice result</span>
          <h1>Practice complete</h1>
          <div className="chip-row compact-row">
            <span className="chip">Simulated feedback</span>
            <span className="chip">Mock result</span>
          </div>
        </div>
      </section>
      <section className="feedback-card">
        <h2>Result</h2>
        <div className="feedback-line">
          <span>{lastFeedback?.title ?? task.title}</span>
          <strong>{lastFeedback?.resultText ?? "Ready"}</strong>
        </div>
        <div className="feedback-line">
          <span>State</span>
          <strong>{lastFeedback?.submissionStatus ?? "No new submission"}</strong>
        </div>
      </section>
      <section className="feedback-card">
        <h2>What to review</h2>
        <div className="chip-row">
          <span className="chip">Plant names</span>
          <span className="chip">Part functions</span>
        </div>
      </section>
      <section className="feedback-card">
        <h2>Next step</h2>
        <div className="chip-row">
          <span className="chip">Try again</span>
          <span className="chip">Start next</span>
        </div>
      </section>
      <ReflectionPanel
        reflection={reflection}
        setReflection={setReflection}
        reflectionSubmitted={reflectionSubmitted}
        onReflectionSubmit={onReflectionSubmit}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
      />
      <div className="two-actions">
        <button
          className="secondary-button"
          onClick={() => navigate({ screen: "path", pathId: experience.activePath?.pathId ?? "PTH01" })}
        >
          <Route size={17} />
          Back to path
        </button>
        <button className="primary-button" onClick={() => navigate({ screen: "growth" })}>
          <BarChart3 size={17} />
          View progress
        </button>
      </div>
    </div>
  );
}

function ProgressScreen({
  experience,
  reflection,
  setReflection,
  reflectionSubmitted,
  onReflectionSubmit,
  difficulty,
  setDifficulty,
  navigate,
}: {
  experience: StudentExperience;
  reflection: string;
  setReflection: (value: string) => void;
  reflectionSubmitted: boolean;
  onReflectionSubmit: () => void;
  difficulty: string;
  setDifficulty: (value: string) => void;
  navigate: (route: RouteState) => void;
}) {
  const pathId = experience.activePath?.pathId ?? "PTH01";

  return (
    <div className="screen-stack">
      <section className="growth-hero">
        <div>
          <span className="small-label">Progress</span>
          <h1>My practice</h1>
          <div className="chip-row compact-row">
            <span className="chip">Mock progress</span>
            <span className="chip">Unit 6</span>
          </div>
        </div>
        <PlantMiniScene />
      </section>

      <section className="progress-section credit-total-card">
        <div className="section-title-row">
          <div>
            <span className="small-label">My Credits</span>
            <h2>{experience.studentProfile.creditTotal} credits</h2>
          </div>
          <Award size={22} />
        </div>
        <ProgressRail completed={experience.activePath?.completedCount ?? 0} total={experience.activePath?.totalCount ?? 6} />
        <div className="credit-visual">
          <span>{experience.studentProfile.creditTotal}</span>
          <strong>Unit 6 points</strong>
        </div>
      </section>

      <section className="progress-section">
        <div className="section-title-row">
          <div>
            <span className="small-label">Review Notebook</span>
            <h2>Needs Review</h2>
          </div>
          <ClipboardCheck size={20} />
        </div>
        <div className="review-notebook-list">
          {experience.studentProfile.reviewItems.map((item) => (
            <article key={item.taskId} className="review-notebook-card">
              <div>
                <span className="step-pill">{item.label}</span>
                <strong>{item.title}</strong>
                <small>{item.focus}</small>
              </div>
              <div className="review-actions">
                <button className="secondary-button compact-button" onClick={() => navigate({ screen: "task", taskId: item.taskId })}>
                  <RefreshCw size={15} />
                  Retry Original
                </button>
                <button className="secondary-button compact-button" onClick={() => navigate({ screen: "path", pathId })}>
                  <Leaf size={15} />
                  Practice Similar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <ReflectionPanel
        reflection={reflection}
        setReflection={setReflection}
        reflectionSubmitted={reflectionSubmitted}
        onReflectionSubmit={onReflectionSubmit}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
      />
    </div>
  );
}

function ProfileScreen({ experience, navigate }: { experience: StudentExperience; navigate: (route: RouteState) => void }) {
  const profile = experience.studentProfile;
  const pathId = experience.activePath?.pathId ?? "PTH01";

  return (
    <div className="screen-stack profile-screen">
      <section className="profile-hero">
        <div className="profile-avatar" aria-hidden="true">
          <UserRound size={28} />
        </div>
        <div>
          <span className="small-label">My Profile</span>
          <h1>Plant learner</h1>
          <div className="chip-row compact-row">
            <span className="chip">Prototype</span>
            <span className="chip">Grade 7 English</span>
          </div>
        </div>
      </section>

      <section className="profile-panel ability-panel">
        <div className="section-title-row">
          <div>
            <h2>Ability Profile</h2>
            <span className="small-note">Strong · Growing · Needs Practice</span>
          </div>
          <BadgeCheck size={18} />
        </div>
        <div className="ability-map">
          <AbilityRadar abilities={profile.abilities} />
          <div className="ability-list">
            {profile.abilities.map((ability) => (
              <article key={ability.label} className="ability-row">
                <div>
                  <strong>{ability.label}</strong>
                  <small>{ability.note}</small>
                </div>
                <span className={`band ${bandClassName(ability.band)}`}>{ability.band}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="profile-panel">
        <div className="section-title-row">
          <h2>Thinking Skills</h2>
          <Brain size={18} />
        </div>
        <div className="thinking-profile-map">
          <ThinkingRadar skills={profile.thinkingSkills} />
          <div className="thinking-skill-grid">
            {profile.thinkingSkills.map((skill) => (
              <article key={skill.label} className="thinking-skill-card">
                <div>
                  <strong>{skill.label}</strong>
                  <span className={`band ${bandClassName(skill.band)}`}>{skill.band}</span>
                </div>
                <small>{skill.next}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="profile-panel">
        <div className="section-title-row">
          <h2>Learning Strategies</h2>
          <Target size={18} />
        </div>
        <div className="strategy-action-list">
          {profile.strategies.map((strategy) => (
            <span key={strategy}>
              <Leaf size={15} />
              {strategy}
            </span>
          ))}
        </div>
      </section>

      <section className="profile-panel">
        <div className="section-title-row">
          <h2>My Badges</h2>
          <Award size={18} />
        </div>
        <div className="badge-grid">
          {profile.badges.map((badge) => (
            <article key={badge.label} className="badge-card">
              <Award size={19} />
              <strong>{badge.label}</strong>
              <small>{badge.detail}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="profile-panel class-card">
        <div className="section-title-row">
          <h2>My Class</h2>
          <UserRound size={18} />
        </div>
        <div className="class-card-body">
          <div>
            <strong>{profile.classInfo.name}</strong>
            <span>{profile.classInfo.group}</span>
            <small>Weekly goal: {profile.classInfo.weeklyGoal}</small>
          </div>
          <button className="secondary-button compact-button" onClick={() => navigate({ screen: "path", pathId })}>
            <Route size={15} />
            Start path
          </button>
        </div>
      </section>
    </div>
  );
}

function AbilityRadar({ abilities }: { abilities: StudentProfileSummary["abilities"] }) {
  const center = 90;
  const maxRadius = 64;
  const points = abilities.map((ability, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / abilities.length;
    const radius = maxRadius * (ability.level / 100);
    return {
      label: ability.label,
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
      labelX: center + Math.cos(angle) * 77,
      labelY: center + Math.sin(angle) * 77,
    };
  });
  const polygonPoints = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const gridRings = [24, 44, 64];

  return (
    <svg className="ability-radar" viewBox="0 0 180 180" role="img" aria-label="Ability profile map">
      {gridRings.map((radius) => (
        <circle key={radius} cx={center} cy={center} r={radius} fill="none" stroke="#d9e2dc" strokeWidth="1" />
      ))}
      {points.map((point) => (
        <line key={point.label} x1={center} y1={center} x2={point.labelX} y2={point.labelY} stroke="#d9e2dc" strokeWidth="1" />
      ))}
      <polygon points={polygonPoints} fill="rgba(22, 132, 95, 0.24)" stroke="#16845f" strokeWidth="2" />
      {points.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} r="3.4" fill="#16845f" />
          <text x={point.labelX} y={point.labelY} textAnchor="middle" dominantBaseline="central">
            {shortAbilityLabel(point.label)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function shortAbilityLabel(label: string): string {
  const labels: Record<string, string> = {
    "Vocabulary Understanding": "Vocab",
    "Sentence Comprehension": "Sent",
    "Process Sequencing": "Seq",
    "Evidence Use": "Evidence",
    "Explanation Quality": "Explain",
  };
  return labels[label] ?? label;
}

function ThinkingRadar({ skills }: { skills: StudentProfileSummary["thinkingSkills"] }) {
  const center = 82;
  const maxRadius = 58;
  const points = skills.map((skill, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / skills.length;
    const radius = maxRadius * (skill.level / 100);
    return {
      label: skill.label,
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
      labelX: center + Math.cos(angle) * 70,
      labelY: center + Math.sin(angle) * 70,
    };
  });
  const polygonPoints = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");

  return (
    <svg className="thinking-radar" viewBox="0 0 164 164" role="img" aria-label="Thinking Skills visual profile">
      {[22, 40, 58].map((radius) => (
        <circle key={radius} cx={center} cy={center} r={radius} fill="none" stroke="#d9e2dc" strokeWidth="1" />
      ))}
      {points.map((point) => (
        <line key={point.label} x1={center} y1={center} x2={point.labelX} y2={point.labelY} stroke="#d9e2dc" strokeWidth="1" />
      ))}
      <polygon points={polygonPoints} fill="rgba(47, 127, 184, 0.2)" stroke="#2f7fb8" strokeWidth="2" />
      {points.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} r="3.2" fill="#2f7fb8" />
          <text x={point.labelX} y={point.labelY} textAnchor="middle" dominantBaseline="central">
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function ReflectionPanel({
  reflection,
  setReflection,
  reflectionSubmitted,
  onReflectionSubmit,
  difficulty,
  setDifficulty,
}: {
  reflection: string;
  setReflection: (value: string) => void;
  reflectionSubmitted: boolean;
  onReflectionSubmit: () => void;
  difficulty: string;
  setDifficulty: (value: string) => void;
}) {
  return (
    <section className="reflection-panel">
      <div className="section-title-row">
        <h2>Reflection</h2>
        <Pencil size={18} />
      </div>
      <label>
        <span>What helped you today?</span>
        <textarea
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
          placeholder="Example: I used the diagram before choosing the word."
        />
      </label>
      <div className="segmented-control" role="group" aria-label="Task difficulty rating">
        {["Easy", "Just right", "Hard"].map((item) => (
          <button
            key={item}
            className={difficulty === item ? "selected" : ""}
            onClick={() => setDifficulty(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      <button className="primary-button reflection-submit" type="button" onClick={onReflectionSubmit}>
        <Send size={17} />
        Submit
      </button>
      {reflectionSubmitted && <div className="submit-confirmation">Reflection submitted</div>}
    </section>
  );
}

function TaskTopBar({
  task,
  experience,
  navigate,
}: {
  task: SafeTaskCard | undefined;
  experience: StudentExperience;
  navigate: (route: RouteState) => void;
}) {
  return (
    <header className="task-topbar">
      <button
        className="icon-button"
        aria-label="Back to path"
        onClick={() => navigate({ screen: "path", pathId: experience.activePath?.pathId ?? "PTH01" })}
      >
        <ArrowLeft size={20} />
      </button>
      <div>
        <strong>{task ? `Task ${task.stepNo} of ${experience.taskCards.length}` : "Task"}</strong>
        <ProgressRail completed={Math.max((task?.stepNo ?? 1) - 1, 0)} total={experience.taskCards.length} compact />
      </div>
      <button className="text-button" onClick={() => navigate({ screen: "home" })}>
        Exit
      </button>
    </header>
  );
}

function BottomNav({
  route,
  experience,
  navigate,
}: {
  route: RouteState;
  experience: StudentExperience;
  navigate: (route: RouteState) => void;
}) {
  const pathId = experience.activePath?.pathId ?? "PTH01";
  const items = [
    { label: "Home", icon: Home, route: { screen: "home" } as RouteState, selected: route.screen === "home" },
    { label: "Path", icon: Route, route: { screen: "path", pathId } as RouteState, selected: route.screen === "path" },
    { label: "Progress", icon: BarChart3, route: { screen: "growth" } as RouteState, selected: route.screen === "growth" },
    { label: "Profile", icon: UserRound, route: { screen: "profile" } as RouteState, selected: route.screen === "profile" },
  ];

  return (
    <nav className="bottom-nav" aria-label="Student navigation">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.label} className={item.selected ? "selected" : ""} onClick={() => navigate(item.route)}>
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function SimulationNotice() {
  return (
    <aside className="simulation-notice">
      <span>Prototype</span>
      <span>Mock progress</span>
    </aside>
  );
}

function ProgressRail({ completed, total, compact = false }: { completed: number; total: number; compact?: boolean }) {
  return (
    <div
      className={compact ? "progress-rail compact" : "progress-rail"}
      style={{ "--segments": total } as CSSProperties}
      aria-label={`${completed} of ${total} complete`}
    >
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={index < completed ? "filled" : ""} />
      ))}
    </div>
  );
}

function StatusPill({ status }: { status: SafeTaskCard["status"] }) {
  return <span className={`status-pill ${status.toLowerCase()}`}>{formatTaskStatus(status)}</span>;
}

function formatPathStatus(status: string): string {
  if (status === "PUBLISHED") {
    return "Ready";
  }
  return String(status).toLowerCase().replace(/_/g, " ");
}

function formatTaskStatus(status: SafeTaskCard["status"]): string {
  if (status === "COMPLETED") {
    return "Complete";
  }
  if (status === "LOCKED") {
    return "Locked";
  }
  if (status === "REVIEW_PENDING") {
    return "Review";
  }
  return "Ready";
}

function bandClassName(band: StudentProfileSummary["abilities"][number]["band"]): string {
  if (band === "Strong") {
    return "strong";
  }
  if (band === "Needs Practice") {
    return "needs-practice";
  }
  return "growing";
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <section className="empty-state">
      <Info size={24} />
      <h1>{title}</h1>
      <p>{body}</p>
    </section>
  );
}

function PlantDiagram() {
  return (
    <svg className="plant-diagram" viewBox="0 0 320 260" role="img" aria-label="Self-made plant diagram">
      <rect x="0" y="0" width="320" height="260" rx="8" fill="#f8fbf6" />
      <path d="M60 214 C92 188 218 188 260 214 C228 234 88 235 60 214Z" fill="#8b5a2b" opacity="0.9" />
      <path d="M154 205 C148 172 150 126 160 82" stroke="#2f7d4f" strokeWidth="9" strokeLinecap="round" />
      <path d="M158 198 C142 218 130 230 114 243" stroke="#c78a35" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M159 199 C176 220 194 230 216 240" stroke="#c78a35" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M154 202 C152 226 150 238 147 250" stroke="#c78a35" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="132" cy="103" rx="33" ry="18" fill="#65b96a" transform="rotate(-32 132 103)" />
      <ellipse cx="194" cy="101" rx="36" ry="19" fill="#56a85c" transform="rotate(28 194 101)" />
      <ellipse cx="135" cy="144" rx="27" ry="16" fill="#74c277" transform="rotate(26 135 144)" />
      <ellipse cx="197" cy="151" rx="29" ry="16" fill="#67b86a" transform="rotate(-24 197 151)" />
      <circle cx="160" cy="124" r="11" fill="#f7d86a" />
      <circle cx="160" cy="124" r="5" fill="#b26a2c" />
      <line x1="74" y1="72" x2="124" y2="96" stroke="#88a199" strokeWidth="2" strokeDasharray="4 4" />
      <line x1="248" y1="84" x2="195" y2="99" stroke="#88a199" strokeWidth="2" strokeDasharray="4 4" />
      <line x1="79" y1="167" x2="138" y2="143" stroke="#88a199" strokeWidth="2" strokeDasharray="4 4" />
      <line x1="249" y1="210" x2="205" y2="220" stroke="#88a199" strokeWidth="2" strokeDasharray="4 4" />
      {[
        ["A", 42, 52],
        ["B", 250, 64],
        ["C", 42, 148],
        ["D", 248, 194],
      ].map(([label, x, y]) => (
        <g key={label}>
          <rect x={Number(x) - 24} y={Number(y) - 18} width="48" height="36" rx="8" fill="#ffffff" stroke="#9aa9a7" strokeDasharray="5 4" />
          <text x={Number(x)} y={Number(y) + 5} textAnchor="middle" fontSize="18" fontWeight="700" fill="#123d35">
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function PlantMiniScene() {
  return (
    <svg className="plant-mini-scene" viewBox="0 0 180 120" role="img" aria-label="Self-made sprouting plants">
      <path d="M24 94 C52 72 124 71 158 94 C126 112 55 113 24 94Z" fill="#9a6b3f" />
      <path d="M74 90 C73 62 78 40 90 22" stroke="#2f7d4f" strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="62" cy="52" rx="20" ry="11" fill="#65b96a" transform="rotate(-36 62 52)" />
      <ellipse cx="99" cy="46" rx="22" ry="12" fill="#56a85c" transform="rotate(27 99 46)" />
      <path d="M118 89 C117 69 121 55 133 42" stroke="#5a9f70" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="132" cy="58" rx="17" ry="9" fill="#8bcf93" transform="rotate(28 132 58)" />
      <circle cx="106" cy="67" r="6" fill="#f6cf64" />
      <circle cx="111" cy="88" r="4" fill="#5a321b" />
      <circle cx="57" cy="88" r="4" fill="#5a321b" />
    </svg>
  );
}

function PlantCardArt() {
  return (
    <div className="plant-card-art" aria-hidden="true">
      <PlantMiniScene />
    </div>
  );
}
