"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table";
import { DecisionTraceTimeline } from "@/components/decision-trace-timeline";
import { GuardPanel } from "@/components/guard-panel";
import { SafeProjectionPreview } from "@/components/safe-projection-preview";
import { StatusBadge } from "@/components/status-badge";
import { buildStudentSafeProjection, canPublishLearningPath, createDecisionTrace } from "@/lib/admin-workflows";
import { postPathDecision } from "@/lib/admin-browser-api";
import type { AdminScope, DecisionTrace, DecisionTraceAction, LearningPathReviewRecord, ReviewCase, TableColumn } from "@/lib/admin-types";

const pathTaskColumns: TableColumn<LearningPathReviewRecord["tasks"][number]>[] = [
  { key: "title", header: "Task" },
  { key: "taskType", header: "Type" },
  { key: "bloom", header: "Bloom" },
  { key: "thinking", header: "Thinking" },
  { key: "minutes", header: "Min" },
  {
    key: "annotationState",
    header: "Annotation",
    render: (row) => <StatusBadge tone={row.annotationState === "APPROVED" ? "success" : row.annotationState === "BLOCKED" ? "blocked" : "warning"}>{row.annotationState}</StatusBadge>,
  },
];

export function PathReviewWorkspace({
  scope,
  path,
  reviewCases,
  initialTraces,
}: {
  scope: AdminScope;
  path: LearningPathReviewRecord;
  reviewCases: ReviewCase[];
  initialTraces: DecisionTrace[];
}) {
  const [reason, setReason] = useState("");
  const [traces, setTraces] = useState(initialTraces);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<DecisionTraceAction | null>(null);
  const guard = useMemo(() => canPublishLearningPath({ scope, path, reviewCases }), [path, reviewCases, scope]);
  const projection = useMemo(() => buildStudentSafeProjection(path, reviewCases), [path, reviewCases]);

  const recordAction = async (action: DecisionTraceAction) => {
    try {
      setPendingAction(action);
      const apiTrace = await postPathDecision({
        pathId: path.pathId,
        pathVersion: path.version,
        action,
        reason,
      });
      const trace = apiTrace ?? createDecisionTrace({
        actorUserId: "usr_teacher_lina",
        actorLabel: "Lina Chen",
        action,
        objectId: path.pathId,
        beforeSnapshotRef: `snapshot://paths/${path.pathId}/v${path.version}`,
        afterSnapshotRef: action === "MODIFY" || action === "REPLAN" ? `snapshot://paths/${path.pathId}/v${path.version + 1}` : undefined,
        reason,
        ruleVersion: path.ruleVersion,
        lintVersion: "path-lint-2026.06",
        verifierVersion: path.verifierVersion,
      });
      setTraces((current) => [trace, ...current]);
      setError(null);
      setReason("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Decision could not be recorded.");
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="path-review-grid">
      <section className="panel panel-large">
        <div className="panel-heading">
          <div>
            <span className="section-label">Learning path review</span>
            <h2>{path.learnerLabel}</h2>
          </div>
          <StatusBadge tone={path.status === "PUBLISHED" ? "success" : "warning"}>{path.status}</StatusBadge>
        </div>
        <div className="review-summary">
          <div>
            <span>Goal</span>
            <strong>{path.goal}</strong>
          </div>
          <div>
            <span>Class</span>
            <strong>{path.classLabel}</strong>
          </div>
          <div>
            <span>Version</span>
            <strong>v{path.version}</strong>
          </div>
          <div>
            <span>Verifier</span>
            <strong>{path.verifierStatus}</strong>
          </div>
        </div>
        <DataTable columns={pathTaskColumns} rows={path.tasks.map((task) => ({ ...task, href: `/admin/annotations/${task.taskId}:annotation`, meta: task.taskId }))} />
      </section>

      <aside className="panel decision-panel">
        <div className="panel-heading">
          <div>
            <span className="section-label">Teacher decision</span>
            <h2>Approve, modify, reject, replan</h2>
          </div>
        </div>
        <label className="field">
          <span>Reason for modify, reject, or replan</span>
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} placeholder="Record the teacher-facing reason before changing this path." />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="decision-actions">
          <button className="button" type="button" onClick={() => void recordAction("APPROVE")} disabled={pendingAction !== null}>
            {pendingAction === "APPROVE" ? "Recording" : "Approve"}
          </button>
          <button className="button button-secondary" type="button" onClick={() => void recordAction("MODIFY")} disabled={pendingAction !== null}>
            {pendingAction === "MODIFY" ? "Recording" : "Modify"}
          </button>
          <button className="button button-secondary" type="button" onClick={() => void recordAction("REJECT")} disabled={pendingAction !== null}>
            {pendingAction === "REJECT" ? "Recording" : "Reject"}
          </button>
          <button className="button button-secondary" type="button" onClick={() => void recordAction("REPLAN")} disabled={pendingAction !== null}>
            {pendingAction === "REPLAN" ? "Recording" : "Replan"}
          </button>
        </div>
        <GuardPanel result={guard} />
        <button className="button button-wide" type="button" disabled={!guard.allowed}>
          Publish to students
        </button>
      </aside>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="section-label">DecisionTrace display</span>
            <h2>Immutable audit summary</h2>
          </div>
        </div>
        <DecisionTraceTimeline traces={traces} />
      </section>

      <SafeProjectionPreview projection={projection} />
    </div>
  );
}
