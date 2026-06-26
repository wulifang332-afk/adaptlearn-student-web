import { FeatureListPage } from "@/components/feature-list-page";
import { getAdminMonitoringRows } from "@/lib/admin-api";

export default async function LmsMonitoringPage() {
  const rows = (await getAdminMonitoringRows()).filter((row) => String(row.workflow ?? "").includes("LMS"));

  return (
    <FeatureListPage
      title="LMS Sync Monitoring"
      eyebrow="Business retry and compensation"
      description="Retry scoped sync jobs and record compensation after external verification. LMS state cannot make an unpublished path visible."
      guardrail="Business sync summary only"
      rows={rows}
      columns={[
        { key: "workflow", header: "Workflow" },
        { key: "status", header: "Status" },
        { key: "object", header: "Business object" },
        { key: "retry", header: "Retry or compensation" },
        { key: "trace", header: "Trace link" },
      ]}
    />
  );
}
