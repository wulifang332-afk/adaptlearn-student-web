import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { WorkflowTabs } from "@/components/workflow-tabs";
import { getAdminMonitoringRows } from "@/lib/admin-api";

export default async function MonitoringPage() {
  const rows = await getAdminMonitoringRows();

  return (
    <main className="page">
      <WorkflowTabs
        tabs={[
          { href: "/admin/monitoring", label: "Summary" },
          { href: "/admin/monitoring/lms", label: "LMS sync" },
          { href: "/admin/monitoring/audit", label: "Audit summary" },
          { href: "/admin/monitoring/agents", label: "Agent summaries" },
        ]}
      />
      <PageHeader
        title="Monitoring Business Summaries"
        eyebrow="Admin operations"
        description="Inspect business-scoped LMS sync, dead letters, agent summaries, trace links, ReviewCase backlog, and audit coverage without platform configuration controls."
        actions={<StatusBadge tone="neutral">Full trace explorer remains Foundation</StatusBadge>}
      />
      <DataTable
        rows={rows}
        columns={[
          { key: "workflow", header: "Workflow" },
          { key: "status", header: "Status" },
          { key: "object", header: "Business object" },
          { key: "retry", header: "Operational state" },
          { key: "trace", header: "Trace link" },
        ]}
      />
    </main>
  );
}
