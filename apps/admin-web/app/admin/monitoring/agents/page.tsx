import { FeatureListPage } from "@/components/feature-list-page";
import { getAdminMonitoringRows } from "@/lib/admin-api";

export default async function AgentMonitoringPage() {
  const rows = (await getAdminMonitoringRows()).filter((row) => !String(row.workflow ?? "").includes("LMS"));

  return (
    <FeatureListPage
      title="Agent Run Summaries"
      eyebrow="Business-scoped agent visibility"
      description="Summaries show workflow status, citation coverage, guardrail outcome, ReviewCase link, and trace link. Technical configuration stays outside Admin Web."
      guardrail="Business summaries only"
      rows={rows}
      columns={[
        { key: "workflow", header: "Workflow" },
        { key: "status", header: "Status" },
        { key: "object", header: "Business object" },
        { key: "retry", header: "Guardrail / retry" },
        { key: "trace", header: "Trace link" },
      ]}
    />
  );
}
