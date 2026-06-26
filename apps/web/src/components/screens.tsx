"use client";

import type { SafeTaskCard, StudentTask, SubmissionResponse } from "@adaptlearn/shared";
import {
  BadgeCheck,
  BookOpenCheck,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Leaf,
  LockKeyhole,
  Mic,
  RefreshCw,
  Send,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createIdempotencyKey } from "@/lib/idempotency";
import { useStudentStore } from "@/store/student-store";
import { PlantCardArt, PlantMiniScene } from "./plant-art";
import { SimulationNotice } from "./student-shell";

export function HomeScreen() {
  const router = useRouter();
  const home = useStudentStore((state) => state.home);
  const status = useStudentStore((state) => state.status);
  const loadHome = useStudentStore((state) => state.loadHome);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  if (!home && status === "loading") {
    return <LoadingState label="Loading home" />;
  }
  if (!home) {
    return <EmptyState title="No student path available" body="Only valid published paths can appear here." />;
  }

  const path = home.activePath;
  const task = home.recommendedTask;

  return (
    <div className="screen-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">{home.student.course}</p>
          <span className="unit-badge">{home.unit.id}</span>
          <h1>{home.unit.title}</h1>
        </div>
        <PlantMiniScene />
      </section>

      <section className="summary-band home-quick-grid" aria-label="Today summary">
        <div>
          <span className="small-label">Today</span>
          <strong>{home.unit.theme}</strong>
          <p>Unit 6 task</p>
        </div>
        <div>
          <span className="small-label">Deadline</span>
          <strong>
            <Clock3 size={17} />
            {home.unit.dueLabel}
          </strong>
          <p>Finish by 18:00</p>
        </div>
      </section>

      <section className="path-hero">
        <div className="section-title-row">
          <div>
            <span className="small-label">Your Learning Path</span>
            <h2>
              {path.completedCount} of {path.totalCount} tasks complete
            </h2>
          </div>
          <Link className="icon-button" aria-label="View learning path" href={path.route}>
            <ChevronRight size={20} />
          </Link>
        </div>
        <ProgressRail completed={path.completedCount} total={path.totalCount} />
        <div className="path-meta-grid">
          <span>
            <Clock3 size={16} /> {path.totalMinutes} min
          </span>
          <span>
            <BookOpenCheck size={16} /> Published
          </span>
          <span>
            <ClipboardCheck size={16} /> {path.totalCount} steps
          </span>
        </div>
      </section>

      <section className="task-feature">
        <div className="section-title-row">
          <div>
            <span className="small-label">Today&apos;s Task</span>
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
              <span className="chip">
                <Clock3 size={15} /> Due Today
              </span>
            </div>
            <button className="primary-button" onClick={() => router.push(`/student/tasks/${task.taskId}`)}>
              <Leaf size={18} />
              Start
            </button>
          </div>
        </div>
      </section>
      <SimulationNotice />
    </div>
  );
}

export function PathScreen({ pathId }: { pathId: string }) {
  const path = useStudentStore((state) => state.path);
  const status = useStudentStore((state) => state.status);
  const loadPath = useStudentStore((state) => state.loadPath);

  useEffect(() => {
    void loadPath(pathId);
  }, [loadPath, pathId]);

  if (!path && status === "loading") {
    return <LoadingState label="Loading path" />;
  }
  if (!path) {
    return <EmptyState title="No path found" body="Only your published path can appear here." />;
  }

  return (
    <div className="screen-stack">
      <section className="path-intro">
        <span className="small-label">Unit 6 Learning Path</span>
        <h1>{path.goal}</h1>
        <div className="path-meta-grid">
          <span>
            <Clock3 size={16} /> {path.totalMinutes} min
          </span>
          <span>
            <ClipboardCheck size={16} /> {path.totalCount} tasks
          </span>
          <span>
            <Check size={16} /> Published
          </span>
          <span>Prototype</span>
        </div>
      </section>

      <section className="timeline" aria-label="Learning path task timeline">
        {path.taskCards.map((task) => (
          <PathTaskCard key={task.taskId} task={task} />
        ))}
      </section>
    </div>
  );
}

function PathTaskCard({ task }: { task: SafeTaskCard }) {
  const isLocked = task.status === "LOCKED";
  return (
    <article className={`path-task ${task.status.toLowerCase()}`}>
      <div className="timeline-marker" aria-hidden="true">
        {task.status === "COMPLETED" ? <Check size={18} /> : isLocked ? <LockKeyhole size={17} /> : task.stepNo}
      </div>
      <div className="path-task-body">
        <div className="section-title-row">
          <div>
            <div className="path-step-title">
              <span className="path-step-label">Step {task.stepNo}</span>
              <span className="small-label">{task.bloom}</span>
            </div>
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
        {isLocked ? (
          <button className="secondary-button muted" disabled>
            <LockKeyhole size={17} />
            Locked
          </button>
        ) : (
          <Link className="secondary-button" href={`/student/tasks/${task.taskId}`}>
            <ChevronRight size={17} />
            Start
          </Link>
        )}
      </div>
    </article>
  );
}

export function TaskScreen({ taskId }: { taskId: string }) {
  const router = useRouter();
  const task = useStudentStore((state) => state.currentTask);
  const home = useStudentStore((state) => state.home);
  const status = useStudentStore((state) => state.status);
  const error = useStudentStore((state) => state.error);
  const feedback = useStudentStore((state) => state.feedbackByTaskId[taskId]);
  const loadTask = useStudentStore((state) => state.loadTask);
  const loadHome = useStudentStore((state) => state.loadHome);
  const submitTask = useStudentStore((state) => state.submitTask);

  const [labels, setLabels] = useState<Record<string, string>>({});
  const [classification, setClassification] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [explanation, setExplanation] = useState("");
  const [reason, setReason] = useState("");
  const [recording, setRecording] = useState<"idle" | "recording" | "saved">("idle");

  useEffect(() => {
    void loadHome();
    void loadTask(taskId);
  }, [loadHome, loadTask, taskId]);

  useEffect(() => {
    setLabels({});
    setClassification({});
    setOrder([]);
    setSelected([]);
    setExplanation("");
    setReason("");
    setRecording("idle");
  }, [taskId]);

  const activeTask = task?.taskId === taskId ? task : undefined;
  const path = home?.activePath;

  if (!activeTask && status === "loading") {
    return <LoadingState label="Loading task" />;
  }
  if (!activeTask) {
    return <EmptyState title="Task unavailable" body={error ?? "This task may be locked or no longer available."} />;
  }

  const submitted = Boolean(feedback);
  const response = buildResponse(activeTask, { labels, classification, order, selected, explanation, reason, recording });

  const onSubmit = async () => {
    if (!path || submitted) {
      return;
    }
    await submitTask(activeTask.taskId, {
      learnerId: home.student.studentId,
      taskId: activeTask.taskId,
      pathId: path.pathId,
      pathVersion: path.version,
      idempotencyKey: createIdempotencyKey(activeTask.taskId),
      response,
    });
  };

  return (
    <div className="screen-stack">
      <section className="task-prompt">
        <div className="task-kicker">
          <span>Step {activeTask.stepNo || "Practice"}</span>
          <span>{activeTask.bloom}</span>
          <span>{activeTask.minutes} min</span>
        </div>
        <h1>{activeTask.title}</h1>
        <p>{activeTask.prompt}</p>
        <div className="chip-row">
          <span className="chip">{activeTask.taskType}</span>
          <span className="chip">{activeTask.responseFormat}</span>
        </div>
      </section>

      <section className="practice-panel">
        <TaskInteraction
          task={activeTask}
          labels={labels}
          setLabels={setLabels}
          classification={classification}
          setClassification={setClassification}
          order={order}
          setOrder={setOrder}
          selected={selected}
          setSelected={setSelected}
          explanation={explanation}
          setExplanation={setExplanation}
          reason={reason}
          setReason={setReason}
          recording={recording}
          setRecording={setRecording}
          disabled={submitted}
        />
        <button className="primary-button" onClick={onSubmit} disabled={submitted || !path}>
          <Send size={18} />
          {activeTask.interactionKind === "classification" || activeTask.interactionKind === "multi_select" ? "Check" : "Submit"}
        </button>
      </section>

      {feedback && <TaskFeedbackCard feedback={feedback} onNext={() => feedback.nextTaskId ? router.push(`/student/tasks/${feedback.nextTaskId}`) : router.push("/student/progress")} />}
    </div>
  );
}

type InteractionProps = {
  task: StudentTask;
  labels: Record<string, string>;
  setLabels: (labels: Record<string, string>) => void;
  classification: Record<string, string>;
  setClassification: (classification: Record<string, string>) => void;
  order: string[];
  setOrder: (order: string[]) => void;
  selected: string[];
  setSelected: (selected: string[]) => void;
  explanation: string;
  setExplanation: (value: string) => void;
  reason: string;
  setReason: (value: string) => void;
  recording: "idle" | "recording" | "saved";
  setRecording: (value: "idle" | "recording" | "saved") => void;
  disabled: boolean;
};

function TaskInteraction(props: InteractionProps) {
  const { task } = props;

  if (task.interactionKind === "plant_label" || task.interactionKind === "similar_label") {
    const targets = (task.options.targets as Array<{ key: string; label: string; helper: string }>) ?? [];
    const labels = (task.options.labels as string[]) ?? [];
    return (
      <div className="label-layout">
        <PlantCardArt />
        <div className="answer-stack">
          {targets.map((target) => (
            <label key={target.key} className="answer-row">
              <span>
                <strong>{target.label}</strong>
                <small>{target.helper}</small>
              </span>
              <select
                aria-label={`Choose label for ${target.label}`}
                value={props.labels[target.key] ?? ""}
                onChange={(event) => props.setLabels({ ...props.labels, [target.key]: event.target.value })}
                disabled={props.disabled}
              >
                <option value="">Choose label</option>
                {labels.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (task.interactionKind === "classification" || task.interactionKind === "similar_classification") {
    const terms = (task.options.terms as string[]) ?? [];
    const zones = (task.options.zones as Array<{ key: string; label: string }>) ?? [];
    return (
      <div className="answer-stack">
        {terms.map((term) => (
          <label key={term} className="answer-row">
            <span>{formatTerm(term)}</span>
            <select
              aria-label={`Classify ${formatTerm(term)}`}
              value={props.classification[term] ?? ""}
              onChange={(event) => props.setClassification({ ...props.classification, [term]: event.target.value })}
              disabled={props.disabled}
            >
              <option value="">Choose category</option>
              {zones.map((zone) => (
                <option key={zone.key} value={zone.key}>
                  {zone.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    );
  }

  if (task.interactionKind === "sequence" || task.interactionKind === "similar_sequence") {
    const steps = (task.options.steps as Array<{ key: string; label: string }>) ?? [];
    const remaining = steps.filter((step) => !props.order.includes(step.key));
    return (
      <div className="sequence-layout">
        <div className="chip-row">
          {remaining.map((step) => (
            <button
              key={step.key}
              className="choice-chip"
              onClick={() => props.setOrder([...props.order, step.key])}
              disabled={props.disabled}
            >
              {step.label}
            </button>
          ))}
        </div>
        <ol className="sequence-list">
          {props.order.map((key) => (
            <li key={key}>{steps.find((step) => step.key === key)?.label ?? key}</li>
          ))}
        </ol>
        <button className="secondary-button" onClick={() => props.setOrder([])} disabled={props.disabled}>
          <RefreshCw size={16} />
          Reset
        </button>
      </div>
    );
  }

  if (task.interactionKind === "multi_select") {
    const choices = (task.options.choices as Array<{ key: string; label: string }>) ?? [];
    return (
      <div className="choice-grid">
        {choices.map((choice) => {
          const active = props.selected.includes(choice.key);
          return (
            <button
              key={choice.key}
              className={active ? "choice-card selected" : "choice-card"}
              onClick={() =>
                props.setSelected(
                  active ? props.selected.filter((item) => item !== choice.key) : [...props.selected, choice.key],
                )
              }
              disabled={props.disabled}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (task.interactionKind === "evaluation" || task.interactionKind === "similar_evaluation") {
    const explanations = (task.options.explanations as Array<{ key: string; label: string }>) ?? [];
    const reasons = (task.options.reasons as Array<{ key: string; label: string }> | undefined) ?? [
      { key: "evidence", label: "uses evidence" },
      { key: "causeEffect", label: "explains cause and effect" },
    ];
    return (
      <div className="answer-stack">
        <span className="small-label">Choose one strongest explanation</span>
        {explanations.map((option) => (
          <button
            key={option.key}
            className={props.explanation === option.key ? "choice-card selected" : "choice-card"}
            onClick={() => props.setExplanation(option.key)}
            disabled={props.disabled}
          >
            {option.label}
          </button>
        ))}
        <label className="answer-row">
          <span>Reason</span>
          <select value={props.reason} onChange={(event) => props.setReason(event.target.value)} disabled={props.disabled}>
            <option value="">Choose reason</option>
            {reasons.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  return (
    <div className="speaking-panel">
      <div className="mic-orb" aria-label="Simulated recording waveform">
        <Mic size={34} />
      </div>
      <button
        className="secondary-button"
        onClick={() => props.setRecording(props.recording === "recording" ? "saved" : "recording")}
        disabled={props.disabled}
      >
        <Mic size={17} />
        {props.recording === "recording" ? "Finish recording" : "Hold to speak"}
      </button>
      <p>{props.recording === "saved" ? "Retelling draft saved" : "Prototype voice"}</p>
    </div>
  );
}

export function ProgressScreen() {
  const router = useRouter();
  const progress = useStudentStore((state) => state.progress);
  const loadProgress = useStudentStore((state) => state.loadProgress);
  const startSimilar = useStudentStore((state) => state.startSimilar);
  const [reflection, setReflection] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  if (!progress) {
    return <LoadingState label="Loading progress" />;
  }

  return (
    <div className="screen-stack">
      <section className="growth-hero">
        <div>
          <span className="small-label">My Credits</span>
          <h1>{progress.credits}</h1>
          <p>
            {progress.completedCount} of {progress.totalCount} path tasks complete
          </p>
        </div>
        <Trophy size={76} />
      </section>

      <section className="progress-section">
        <div className="section-title-row">
          <div>
            <span className="small-label">Review Notebook</span>
            <h2>Practice again</h2>
          </div>
        </div>
        <div className="review-list">
          {progress.reviewItems.map((item) => (
            <article key={item.taskId} className="review-item">
              <div>
                <strong>{item.title}</strong>
                <p>{item.focus}</p>
                <span>{item.lastResult}</span>
              </div>
              <div className="review-actions">
                <button className="secondary-button" onClick={() => router.push(`/student/tasks/${item.taskId}`)}>
                  Retry
                </button>
                <button
                  className="primary-button compact"
                  onClick={async () => {
                    const similarTaskId = await startSimilar(item.taskId);
                    router.push(`/student/tasks/${similarTaskId}`);
                  }}
                >
                  Practice Similar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="reflection-panel">
        <span className="small-label">Reflection</span>
        <textarea
          value={reflection}
          onChange={(event) => {
            setReflection(event.target.value);
            setSubmitted(false);
          }}
          placeholder="I noticed..."
        />
        <div className="chip-row">
          {["Easy", "Just right", "Hard"].map((label) => (
            <button key={label} className="choice-chip" type="button">
              {label}
            </button>
          ))}
        </div>
        <button className="primary-button" onClick={() => setSubmitted(true)}>
          Submit
        </button>
        {submitted && <p className="submitted-note">Reflection submitted</p>}
      </section>
    </div>
  );
}

export function ProfileScreen() {
  const profile = useStudentStore((state) => state.profile);
  const loadProfile = useStudentStore((state) => state.loadProfile);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (!profile) {
    return <LoadingState label="Loading profile" />;
  }

  return (
    <div className="screen-stack">
      <section className="profile-hero">
        <span className="small-label">Ability Profile</span>
        <h1>{profile.identity.unitTitle}</h1>
        <p>{profile.identity.focus}</p>
      </section>

      <section className="profile-panel">
        <h2>Ability Profile</h2>
        <div className="metric-list">
          {profile.abilities.map((ability) => (
            <article key={ability.label}>
              <strong>{ability.label}</strong>
              <span>{ability.band}</span>
              <p>{ability.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="profile-panel">
        <h2>Thinking Skills</h2>
        <div className="metric-list">
          {profile.thinkingSkills.map((skill) => (
            <article key={skill.label}>
              <strong>{skill.label}</strong>
              <span>{skill.band}</span>
              <p>{skill.next}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="profile-panel">
        <h2>Learning Strategies</h2>
        <div className="chip-row">
          {profile.strategies.map((strategy) => (
            <span key={strategy} className="chip">
              {strategy}
            </span>
          ))}
        </div>
      </section>

      <section className="profile-panel">
        <h2>My Badges</h2>
        <div className="badge-grid">
          {profile.badges.map((badge) => (
            <article key={badge.label}>
              <BadgeCheck size={20} />
              <strong>{badge.label}</strong>
              <span>{badge.detail}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="profile-panel class-card">
        <h2>My Class</h2>
        <p>{profile.classInfo.name}</p>
        <p>{profile.classInfo.group}</p>
        <p>{profile.classInfo.weeklyGoal}</p>
        <button className="secondary-button">Enter Group Chat</button>
      </section>
    </div>
  );
}

function TaskFeedbackCard({ feedback, onNext }: { feedback: SubmissionResponse; onNext: () => void }) {
  const result = feedback.feedback;
  const isSpeaking = result.feedbackKind === "speaking";
  const cta = feedback.nextTaskId ? "Next task" : "View progress";
  return (
    <section className="task-result-card">
      <span className="small-label">{result.resultText}</span>
      <h2>{result.summary}</h2>
      <p>{result.detail}</p>
      {!isSpeaking && (
        <div className="score-line">
          <Check size={17} />
          {result.correctCount} of {result.totalCount} correct
        </div>
      )}
      <button className="primary-button" onClick={onNext}>
        <ChevronRight size={18} />
        {cta}
      </button>
    </section>
  );
}

function ProgressRail({ completed, total }: { completed: number; total: number }) {
  const width = `${Math.round((completed / Math.max(total, 1)) * 100)}%`;
  return (
    <div className="progress-rail" aria-label={`${completed} of ${total} tasks complete`}>
      <span style={{ width }} />
    </div>
  );
}

function StatusPill({ status }: { status: SafeTaskCard["status"] }) {
  return <span className={`status-pill ${status.toLowerCase()}`}>{formatStatus(status)}</span>;
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <p>{label}</p>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <h1>{title}</h1>
      <p>{body}</p>
    </div>
  );
}

function buildResponse(
  task: StudentTask,
  state: {
    labels: Record<string, string>;
    classification: Record<string, string>;
    order: string[];
    selected: string[];
    explanation: string;
    reason: string;
    recording: string;
  },
) {
  if (task.interactionKind === "plant_label" || task.interactionKind === "similar_label") {
    return { labels: state.labels };
  }
  if (task.interactionKind === "classification" || task.interactionKind === "similar_classification") {
    return { classification: state.classification };
  }
  if (task.interactionKind === "sequence" || task.interactionKind === "similar_sequence") {
    return { order: state.order };
  }
  if (task.interactionKind === "multi_select") {
    return { selected: state.selected };
  }
  if (task.interactionKind === "evaluation" || task.interactionKind === "similar_evaluation") {
    return { explanation: state.explanation, reason: state.reason };
  }
  return { recordingState: state.recording, transcriptDraft: "Mock student retelling" };
}

function formatTerm(term: string) {
  const labels: Record<string, string> = {
    carbonDioxide: "carbon dioxide",
  };
  return labels[term] ?? term;
}

function formatStatus(status: SafeTaskCard["status"]) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
