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
  Network,
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
  queued: boolean;
  correctCount: number;
  totalCount: number;
};

type PlantLabelKey = "root" | "stem" | "leaf" | "seed";
type PracticeState = "ready" | "mic-denied" | "recording" | "upload-failed" | "queued-sync";

const labelOptions: PlantLabelKey[] = ["root", "stem", "leaf", "seed"];
const plantTargets: Array<{ key: PlantLabelKey; label: string; helper: string }> = [
  { key: "leaf", label: "A", helper: "green flat part" },
  { key: "stem", label: "B", helper: "supports the plant" },
  { key: "seed", label: "C", helper: "new plant starter" },
  { key: "root", label: "D", helper: "under the soil" },
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
  const [offlineMode, setOfflineMode] = useState(false);
  const [practiceState, setPracticeState] = useState<PracticeState>("ready");
  const [lastFeedback, setLastFeedback] = useState<LastFeedback | undefined>();
  const [reflection, setReflection] = useState("");
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

    const correctCount = plantTargets.filter((target) => answers[target.key] === target.key).length;
    const submission = submitMockTask(runtimeRef.current, {
      learnerId: experience.student.student_id,
      taskId: task.taskId,
      pathId: experience.activePath.pathId,
      pathVersion: experience.activePath.version,
      offline: offlineMode,
    });
    const nextOverrides = markTaskCompleteAndUnlockNext(experience.taskCards, task.taskId);
    setStepOverrides((current) => ({ ...current, ...nextOverrides }));
    setLastFeedback({
      taskId: task.taskId,
      title: task.title,
      submissionStatus: offlineMode ? "QUEUED_OFFLINE" : submission.status,
      queued: offlineMode,
      correctCount,
      totalCount: plantTargets.length,
    });
    navigate({ screen: "feedback", taskId: task.taskId });
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
              offlineMode={offlineMode}
              setOfflineMode={setOfflineMode}
              practiceState={practiceState}
              setPracticeState={setPracticeState}
              onComplete={handleCompleteTask}
            />
          )}
          {route.screen === "feedback" && activeTask && (
            <FeedbackScreen
              experience={experience}
              task={activeTask}
              lastFeedback={lastFeedback}
              reflection={reflection}
              setReflection={setReflection}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              navigate={navigate}
            />
          )}
          {route.screen === "growth" && (
            <ProgressScreen
              experience={experience}
              reflection={reflection}
              setReflection={setReflection}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
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

      <section className="summary-band">
        <div>
          <span className="small-label">Learning Focus</span>
          <strong>{personaFocusLabel(experience.student.persona_id)}</strong>
          <p>Plant vocabulary</p>
        </div>
        <div>
          <span className="small-label">Path Goal</span>
          <strong>{path?.goal ?? "No path"}</strong>
          <div className="chip-row compact-row">
            {path?.goalTags.map((tag) => (
              <span key={tag} className="chip">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {path && (
        <section className="path-hero">
          <div className="section-title-row">
            <div>
              <span className="small-label">Your Learning Path</span>
              <h2>{path.completedCount} of {path.totalCount} tasks complete</h2>
            </div>
            <button className="icon-button" aria-label="Open learning path" onClick={() => navigate({ screen: "path", pathId: path.pathId })}>
              <ChevronRight size={20} />
            </button>
          </div>
          <ProgressRail completed={path.completedCount} total={path.totalCount} />
          <div className="path-meta-grid">
            <span><Clock3 size={16} /> {path.totalMinutes} min</span>
            <span><BookOpenCheck size={16} /> {formatPathStatus(path.status)}</span>
            <span><Network size={16} /> Offline ready</span>
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
                <span className="chip">{task.riskLabel}</span>
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
            <span className="small-label">{task.module}</span>
            <h2>{task.title}</h2>
          </div>
          <StatusPill status={task.status} />
        </div>
        <div className="chip-row">
          <span className="chip">Step {task.stepNo}</span>
          <span className="chip">{task.nodeNames[0] ?? "Vocabulary"}</span>
          <span className="chip">{task.bloom}</span>
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
          {isLocked ? "Locked" : task.status === "COMPLETED" ? "Review" : "Open"}
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
  offlineMode,
  setOfflineMode,
  practiceState,
  setPracticeState,
  onComplete,
}: {
  task: SafeTaskCard;
  answers: Record<PlantLabelKey, string>;
  setAnswers: (answers: Record<PlantLabelKey, string>) => void;
  showHint: boolean;
  setShowHint: (value: boolean) => void;
  offlineMode: boolean;
  setOfflineMode: (value: boolean) => void;
  practiceState: PracticeState;
  setPracticeState: (value: PracticeState) => void;
  onComplete: (task: SafeTaskCard) => void;
}) {
  const answeredCount = plantTargets.filter((target) => answers[target.key]).length;
  const correctCount = plantTargets.filter((target) => answers[target.key] === target.key).length;
  const isPlantTask = task.taskId === "UI01";

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
          <span className="chip">{task.responseFormat}</span>
          <span className="chip">{task.riskLabel}</span>
        </div>
      </section>

      {isPlantTask ? (
        <section className="practice-panel">
          <PlantDiagram />
          <div className="answer-grid" aria-label="Plant part label answers">
            {plantTargets.map((target) => (
              <label key={target.key} className="answer-slot">
                <span>{target.label}. {target.helper}</span>
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
            <button
              className="secondary-button"
              onClick={() => setAnswers({ root: "", stem: "", leaf: "", seed: "" })}
            >
              <RefreshCw size={17} />
              Reset
            </button>
            <button className="secondary-button" onClick={() => setShowHint(!showHint)}>
              <Lightbulb size={17} />
              Hint
            </button>
          </div>
          {showHint && (
            <div className="hint-box">
              Position helps: roots below, stem in the middle, leaves on the sides, seed in the soil.
            </div>
          )}
          <div className="feedback-meter">
            <span>{answeredCount} of {plantTargets.length} labels selected</span>
            <span>{correctCount} match</span>
          </div>
        </section>
      ) : (
        <section className="practice-panel">
          <textarea className="response-box" defaultValue="" placeholder="Write your mock response here." />
          <div className="hint-box">{task.studentReason}</div>
        </section>
      )}

      <PracticeStatePanel
        task={task}
        practiceState={practiceState}
        setPracticeState={setPracticeState}
        offlineMode={offlineMode}
        setOfflineMode={setOfflineMode}
      />

      <button className="primary-button full-width" onClick={() => onComplete(task)}>
        <Send size={18} />
        Complete mock task
      </button>
    </div>
  );
}

function PracticeStatePanel({
  task,
  practiceState,
  setPracticeState,
  offlineMode,
  setOfflineMode,
}: {
  task: SafeTaskCard;
  practiceState: PracticeState;
  setPracticeState: (value: PracticeState) => void;
  offlineMode: boolean;
  setOfflineMode: (value: boolean) => void;
}) {
  const stateCopy: Record<PracticeState, { label: string; title: string; body: string }> = {
    ready: {
      label: "Ready",
      title: requiresAudioResponse(task) ? "Media ready" : "Diagram ready",
      body: requiresAudioResponse(task) ? "Ask for mic permission." : "Text + diagram input.",
    },
    "mic-denied": {
      label: "Mic denied",
      title: "Microphone permission denied",
      body: "Use text or retry mic.",
    },
    recording: {
      label: "Recording",
      title: "Recording draft",
      body: "Mock recording saved locally.",
    },
    "upload-failed": {
      label: "Upload failed",
      title: "Upload needs retry",
      body: "Draft saved. Retry when ready.",
    },
    "queued-sync": {
      label: "Queued sync",
      title: "Offline answer queued",
      body: "Mock answer queued.",
    },
  };
  const selected = stateCopy[practiceState];

  return (
    <section className="media-state-panel">
      <div className="media-state-copy">
        <Mic size={18} />
        <div>
          <strong>{selected.title}</strong>
          <span>{selected.body}</span>
        </div>
      </div>
      <div className="state-mode-grid" role="group" aria-label="Practice state preview">
        {(Object.keys(stateCopy) as PracticeState[]).map((state) => (
          <button
            key={state}
            className={practiceState === state ? "selected" : ""}
            type="button"
            onClick={() => {
              setPracticeState(state);
              if (state === "queued-sync") {
                setOfflineMode(true);
              }
            }}
          >
            {stateCopy[state].label}
          </button>
        ))}
      </div>
      <div className="media-state-footer">
        <label className="switch-row">
          <span>Work offline</span>
          <input
            type="checkbox"
            checked={offlineMode}
            onChange={(event) => {
              setOfflineMode(event.target.checked);
              if (event.target.checked) {
                setPracticeState("queued-sync");
              }
            }}
          />
        </label>
        {practiceState === "upload-failed" && (
          <button className="secondary-button compact-button" type="button" onClick={() => setPracticeState("ready")}>
            <RefreshCw size={15} />
            Retry
          </button>
        )}
      </div>
    </section>
  );
}

function requiresAudioResponse(task: SafeTaskCard): boolean {
  const response = `${task.responseFormat} ${task.taskType}`.toLowerCase();
  return response.includes("audio") || response.includes("speaking") || response.includes("oral");
}

function FeedbackScreen({
  experience,
  task,
  lastFeedback,
  reflection,
  setReflection,
  difficulty,
  setDifficulty,
  navigate,
}: {
  experience: StudentExperience;
  task: SafeTaskCard;
  lastFeedback: LastFeedback | undefined;
  reflection: string;
  setReflection: (value: string) => void;
  difficulty: string;
  setDifficulty: (value: string) => void;
  navigate: (route: RouteState) => void;
}) {
  const queued = lastFeedback?.queued;

  return (
    <div className="screen-stack">
      <section className={queued ? "feedback-hero queued" : "feedback-hero"}>
        <Trophy size={30} />
        <div>
          <span className="small-label">{queued ? "Queued sync" : "Practice result"}</span>
          <h1>{queued ? "Saved for retry" : "Practice complete"}</h1>
          <div className="chip-row compact-row">
            <span className="chip">{queued ? "Offline retry" : "Simulated feedback"}</span>
            <span className="chip">Mock result</span>
          </div>
        </div>
      </section>
      <section className="feedback-card">
        <h2>Result</h2>
        <div className="feedback-line">
          <span>{lastFeedback?.title ?? task.title}</span>
          <strong>{lastFeedback ? `${lastFeedback.correctCount}/${lastFeedback.totalCount} fixed labels matched` : "Ready"}</strong>
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
          <span className="chip">Open path</span>
        </div>
      </section>
      <ReflectionPanel
        reflection={reflection}
        setReflection={setReflection}
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
  difficulty,
  setDifficulty,
}: {
  experience: StudentExperience;
  reflection: string;
  setReflection: (value: string) => void;
  difficulty: string;
  setDifficulty: (value: string) => void;
}) {
  return (
    <div className="screen-stack">
      <section className="growth-hero">
        <div>
          <span className="small-label">Progress</span>
          <h1>Unit 6 growth</h1>
          <div className="chip-row compact-row">
            <span className="chip">Mock progress</span>
            <span className="chip">Updated today</span>
          </div>
        </div>
        <PlantMiniScene />
      </section>
      <section className="progress-section">
        <div className="section-title-row">
          <h2>Vocabulary</h2>
          <span className="step-pill">Evidence level: {experience.progress.evidenceCoverageLabel}</span>
        </div>
        <div className="knowledge-stack">
          {experience.progress.knowledge.map((item) => (
            <div key={item.nodeId} className="knowledge-row">
              <span>{item.name}</span>
              <strong>{item.label}</strong>
              <small>{item.evidenceCount} evidence items · {item.confidence.toLowerCase()}</small>
            </div>
          ))}
        </div>
      </section>
      <section className="progress-section">
        <h2>Bloom</h2>
        <div className="bloom-grid">
          {experience.progress.bloom.map((item) => (
            <div key={item.label} className="bloom-card">
              <strong>{item.label}</strong>
              <span>{item.emerging + item.confirmed} growing</span>
              <small>{item.needsEvidence} need more evidence</small>
            </div>
          ))}
        </div>
      </section>
      <section className="progress-section">
        <h2>Learning strategy</h2>
        <div className="strategy-list">
          {experience.progress.strategies.map((strategy) => (
            <span key={strategy.label}>
              <Leaf size={15} />
              {strategy.label} · {strategy.count}
            </span>
          ))}
        </div>
      </section>
      <section className="progress-section">
        <h2>Thinking</h2>
        <div className="thinking-stack">
          {experience.progress.thinking.map((item) => (
            <article key={item.label}>
              <strong>{item.label}</strong>
              <span>{item.state}</span>
              <p>{item.helper}</p>
            </article>
          ))}
        </div>
      </section>
      <ReflectionPanel
        reflection={reflection}
        setReflection={setReflection}
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
          <BookOpenCheck size={28} />
        </div>
        <div>
          <span className="small-label">Learning Profile</span>
          <h1>{profile.identity.course}</h1>
          <div className="chip-row compact-row">
            <span className="chip">{profile.identity.unit}</span>
            <span className="chip">{profile.identity.unitTitle}</span>
            <span className="chip">Mock profile</span>
          </div>
        </div>
      </section>

      <section className="profile-summary-grid" aria-label="Student summary">
        <ProfileFact label="Course" value={profile.identity.course} />
        <ProfileFact label="Unit Topic" value={profile.identity.unitTitle} />
        <ProfileFact label="Learning Focus" value={profile.identity.focus} />
        <ProfileFact label="Strategy Preference" value={profile.identity.preference} />
      </section>

      <section className="profile-panel">
        <div className="section-title-row">
          <h2>Learning Credits</h2>
          <Award size={18} />
        </div>
        <div className="credit-grid">
          {profile.credits.map((credit) => (
            <article key={credit.label} className="credit-card">
              <strong>{credit.label}</strong>
              <span>{credit.badge}</span>
              <small>{credit.detail}</small>
              <LevelBar level={credit.level} />
            </article>
          ))}
        </div>
      </section>

      <section className="profile-panel">
        <div className="section-title-row">
          <div>
            <h2>Past Accuracy</h2>
            <span className="small-note">Mock progress</span>
          </div>
          <BarChart3 size={18} />
        </div>
        <div className="accuracy-grid">
          {profile.accuracy.map((item) => (
            <article key={item.label} className="accuracy-card">
              <div>
                <strong>{item.label}</strong>
                <span>{item.value}%</span>
              </div>
              <LevelBar level={item.value} />
              <small>{item.detail}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="profile-panel ability-panel">
        <div className="section-title-row">
          <div>
            <h2>Ability Profile</h2>
            <span className="small-note">Updated today</span>
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
          <h2>Review Collection</h2>
          <button className="text-button compact-link" onClick={() => navigate({ screen: "path", pathId })}>
            Path
          </button>
        </div>
        <div className="review-list">
          {profile.reviewItems.map((item) => (
            <article key={item.taskId} className="review-card">
              <span className="step-pill">{item.label}</span>
              <strong>{item.title}</strong>
              <small>{item.focus} · {item.lastResult}</small>
              <button className="secondary-button compact-button" onClick={() => navigate({ screen: "task", taskId: item.taskId })}>
                Review
              </button>
            </article>
          ))}
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
    </div>
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <article>
      <span className="small-label">{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function LevelBar({ level }: { level: number }) {
  return (
    <div className="level-bar" aria-hidden="true">
      <span style={{ width: `${level}%` }} />
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
    "Sentence Comprehension": "Sentence",
    "Reading Sequence": "Sequence",
    "Evidence Use": "Evidence",
    "Reflection Quality": "Reflect",
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
  difficulty,
  setDifficulty,
}: {
  reflection: string;
  setReflection: (value: string) => void;
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

function personaFocusLabel(personaId: string): string {
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
}

function formatPathStatus(status: string): string {
  if (status === "PUBLISHED") {
    return "Published";
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
