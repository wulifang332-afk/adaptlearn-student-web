import { FeatureListPage } from "@/components/feature-list-page";
import { getAdminResearchRows } from "@/lib/admin-api";

export default async function ResearchPage() {
  const rows = await getAdminResearchRows();

  return (
    <FeatureListPage
      title="Research Evidence"
      eyebrow="Claims and citations"
      description="Govern research claims, evidence sources, citation spans, methodology notes, expert decisions, and source usage for rules, annotations, and teacher guidance."
      guardrail="Expert conclusion cannot be overwritten silently"
      rows={rows}
      columns={[
        { key: "claim", header: "Claim" },
        { key: "source", header: "Evidence source" },
        { key: "status", header: "Decision state" },
        { key: "citation", header: "Citation" },
      ]}
    />
  );
}
