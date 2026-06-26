import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { DecisionTraceTimeline } from "@/components/decision-trace-timeline";
import { GuardPanel } from "@/components/guard-panel";
import { PageHeader } from "@/components/page-header";
import { SafeProjectionPreview } from "@/components/safe-projection-preview";
import { StatusBadge } from "@/components/status-badge";
import { canPublishLearningPath } from "@/lib/admin-workflows";
import type { TableColumn } from "@/lib/admin-types";
import type { AdminDashboardData } from "@/lib/admin-api";
import {
  activeScope,
  dashboardMetrics,
  decisionTraces,
  diagnosisRows,
  learningPaths,
  monitoringRows,
  reviewCases,
  safeProjectionPreview,
  workQueueRows,
} from "@/lib/mock-admin-data";

const queueColumns: TableColumn<(typeof workQueueRows)[number]>[] = [
  { key: "queue", header: "Queue" },
  { key: "item", header: "Human-readable item" },
  { key: "severity", header: "Severity", render: (row) => <StatusBadge tone={row.severity === "BLOCK" ? "blocked" : "warning"}>{row.severity}</StatusBadge> },
  { key: "status", header: "Status" },
  { key: "owner", header: "Owner" },
  { key: "due", header: "SLA" },
];

const diagnosisColumns: TableColumn<(typeof diagnosisRows)[number]>[] = [
  { key: "learner", header: "Learner" },
  { key: "evidence", header: "Evidence sufficiency" },
  { key: "bkt", header: "Knowledge" },
  { key: "bloom", header: "Bloom evidence" },
  { key: "thinking", header: "Thinking quality" },
  { key: "path", header: "Path state" },
];

export function DashboardView({ data }: { data?: AdminDashboardData }) {
  const view = data ?? {
    scope: activeScope,
    metrics: dashboardMetrics,
    workQueueRows,
    diagnosisRows,
    monitoringRows,
    publishGuard: canPublishLearningPath({ scope: activeScope, path: learningPaths[0], reviewCases }),
    decisionTraces,
    safeProjectionPreview,
  };
  const guard = view.publishGuard;

  return (
    <main className="page dashboard-page">
      <PageHeader
        title="Admin Dashboard"
        eyebrow="Business governance"
        description="Scoped queues for content, annotation, diagnosis, learning paths, ReviewCases, LMS sync, and audit summaries."
        actions={<Link href="/admin/review-cases" className="button">Open quality queue</Link>}
      />

      <section className="metric-grid" aria-label="Dashboard summary">
        {view.metrics.map((metric) => (
          <Link href={metric.href} key={metric.label} className="metric-card">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
            <StatusBadge tone={metric.tone}>Scoped</StatusBadge>
          </Link>
        ))}
      </section>

      <div className="dashboard-grid">
        <section className="panel panel-large">
          <div className="panel-heading">
            <div>
              <span className="section-label">Priority review queue</span>
              <h2>Teacher-readable blockers</h2>
            </div>
            <StatusBadge tone="warning">REVIEW creates ReviewCase</StatusBadge>
          </div>
          <DataTable columns={queueColumns} rows={view.workQueueRows} />
        </section>

        <aside className="panel side-panel">
          <div className="panel-heading">
            <div>
              <span className="section-label">Publish guard</span>
              <h2>Path delivery gate</h2>
            </div>
          </div>
          <GuardPanel result={guard} />
          <DecisionTraceTimeline traces={view.decisionTraces} />
        </aside>
      </div>

      <div className="dashboard-grid lower">
        <section className="panel panel-large">
          <div className="panel-heading">
            <div>
              <span className="section-label">Assigned class diagnosis</span>
              <h2>Evidence labels, not rankings</h2>
            </div>
            <StatusBadge tone="info">Teacher class scope only</StatusBadge>
          </div>
          <DataTable columns={diagnosisColumns} rows={view.diagnosisRows} />
        </section>

        <SafeProjectionPreview projection={view.safeProjectionPreview} />
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="section-label">Monitoring business summaries</span>
            <h2>LMS, agent, audit status</h2>
          </div>
          <StatusBadge tone="neutral">Trace links available</StatusBadge>
        </div>
        <div className="monitor-strip">
          {view.monitoringRows.map((row) => (
            <Link key={row.meta} href="/admin/monitoring" className="monitor-card">
              <strong>{row.workflow}</strong>
              <span>{row.object}</span>
              <StatusBadge tone={row.status === "DEAD_LETTER" ? "blocked" : row.status === "REVIEW" ? "warning" : "success"}>{row.status}</StatusBadge>
              <small>{row.retry}</small>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
