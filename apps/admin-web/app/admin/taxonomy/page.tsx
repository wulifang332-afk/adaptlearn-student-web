import { FeatureListPage } from "@/components/feature-list-page";
import { getAdminTaxonomyRows } from "@/lib/admin-api";

export default async function TaxonomyPage() {
  const rows = await getAdminTaxonomyRows();

  return (
    <FeatureListPage
      title="Taxonomy / English Knowledge Graph"
      eyebrow="Knowledge graph management"
      description="Review multi-level English knowledge nodes, reference counts, risk, version changes, merge/deprecate requests, and impact before publishing taxonomy versions."
      guardrail="Student Web receives only safe labels"
      rows={rows}
      columns={[
        { key: "name", header: "Node label" },
        { key: "path", header: "Hierarchy" },
        { key: "level", header: "Level" },
        { key: "module", header: "Module" },
        { key: "tasks", header: "Referenced tasks" },
        { key: "risk", header: "Risk" },
        { key: "status", header: "Status" },
      ]}
    />
  );
}
