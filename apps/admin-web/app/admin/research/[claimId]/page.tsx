import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getAdminResearchRows } from "@/lib/admin-api";

export default async function ResearchDetailPage({ params }: { params: Promise<{ claimId: string }> }) {
  const { claimId } = await params;
  const rows = await getAdminResearchRows();
  const claim = rows.find((row) => row.meta === claimId);

  if (!claim) {
    notFound();
  }

  return (
    <main className="page">
      <PageHeader
        title={String(claim.claim)}
        eyebrow="Research claim"
        description="Research evidence agents can propose claim/evidence links, but expert decision is required before classroom use."
        actions={<StatusBadge tone="warning">{String(claim.status)}</StatusBadge>}
      />
      <section className="panel">
        <div className="review-summary">
          <div>
            <span>Source</span>
            <strong>{String(claim.source ?? "")}</strong>
          </div>
          <div>
            <span>Citation</span>
            <strong>{String(claim.citation ?? "")}</strong>
          </div>
          <div>
            <span>Allowed actions</span>
            <strong>Expert approve, condition, reject, request fix</strong>
          </div>
          <div>
            <span>Internal metadata</span>
            <strong>{claim.meta}</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
