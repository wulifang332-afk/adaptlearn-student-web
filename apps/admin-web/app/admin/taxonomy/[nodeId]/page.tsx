import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getAdminTaxonomyRows } from "@/lib/admin-api";

export default async function TaxonomyDetailPage({ params }: { params: Promise<{ nodeId: string }> }) {
  const { nodeId } = await params;
  const rows = await getAdminTaxonomyRows();
  const node = rows.find((row) => row.meta === nodeId);

  if (!node) {
    notFound();
  }

  return (
    <main className="page">
      <PageHeader
        title={String(node.name)}
        eyebrow="Taxonomy node"
        description="Node changes are versioned. High-impact changes request expert review and preserve compatibility mappings for existing paths."
        actions={<StatusBadge tone="info">{String(node.status)}</StatusBadge>}
      />
      <section className="panel">
        <div className="review-summary">
          <div>
            <span>Hierarchy</span>
            <strong>{String(node.path ?? "")}</strong>
          </div>
          <div>
            <span>Referenced tasks</span>
            <strong>{String(node.tasks ?? "")}</strong>
          </div>
          <div>
            <span>Allowed actions</span>
            <strong>Edit, deprecate, merge, request expert review</strong>
          </div>
          <div>
            <span>Internal metadata</span>
            <strong>{node.meta}</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
