import { FeatureListPage } from "@/components/feature-list-page";
import { getAdminMonitoringRows } from "@/lib/admin-api";

export default async function AuditMonitoringPage() {
  const rows = await getAdminMonitoringRows();

  return (
    <FeatureListPage
      title="Admin Audit Summary"
      eyebrow="Business audit coverage"
      description="Read-only audit coverage for Admin business workflows with links to authorized Foundational Console audit explorer."
      guardrail="No raw audit explorer here"
      rows={rows}
      columns={[
        { key: "workflow", header: "Workflow" },
        { key: "status", header: "Status" },
        { key: "object", header: "Object" },
        { key: "trace", header: "Foundation trace link" },
      ]}
    />
  );
}
