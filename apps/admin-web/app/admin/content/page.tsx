import { FeatureListPage } from "@/components/feature-list-page";
import { getAdminContentRows } from "@/lib/admin-api";

export default async function ContentPage() {
  const rows = await getAdminContentRows();

  return (
    <FeatureListPage
      title="Content Library & Editor"
      eyebrow="Curriculum governance"
      description="Manage Unit content, source metadata, versioning, copyright state, lint handoff, annotation handoff, archive, and governed publish actions."
      guardrail="BLOCK cannot annotate, assemble, publish, or recommend"
      rows={rows}
      columns={[
        { key: "title", header: "Content" },
        { key: "module", header: "Module" },
        { key: "status", header: "State" },
        { key: "source", header: "Source" },
        { key: "copyright", header: "Copyright" },
        { key: "version", header: "Version" },
      ]}
    />
  );
}
