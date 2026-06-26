import { FeatureListPage } from "@/components/feature-list-page";
import { getAdminPackageRows } from "@/lib/admin-api";

export default async function AssemblyPage() {
  const rows = await getAdminPackageRows();

  return (
    <FeatureListPage
      title="Course & Task Assembly"
      eyebrow="Unit packages"
      description="Assemble approved tasks into candidate sets, run Assembly Lint, publish immutable package versions, and expose rationale to teachers."
      guardrail="Only approved tasks and annotations can enter packages"
      rows={rows}
      columns={[
        { key: "title", header: "Package" },
        { key: "audience", header: "Audience" },
        { key: "tasks", header: "Tasks" },
        { key: "lint", header: "Lint" },
        { key: "status", header: "Status" },
      ]}
    />
  );
}
