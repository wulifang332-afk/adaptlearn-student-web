import { FeatureListPage } from "@/components/feature-list-page";
import { getAdminAnnotationRows } from "@/lib/admin-api";

export default async function AnnotationsPage() {
  const rows = await getAdminAnnotationRows();

  return (
    <FeatureListPage
      title="AI Annotation Review"
      eyebrow="Candidate labels"
      description="Review candidate knowledge, Bloom, thinking labels, evidence locations, confidence bands, lint output, ReviewCase state, and expert escalation."
      guardrail="Formal labels require human approval"
      rows={rows}
      columns={[
        { key: "task", header: "Task" },
        { key: "module", header: "Module" },
        { key: "candidate", header: "Candidate nodes" },
        { key: "confidence", header: "Confidence band" },
        { key: "lint", header: "Lint" },
        { key: "status", header: "Status" },
      ]}
    />
  );
}
