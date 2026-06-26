import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getAdminContentRows, getAdminReviewCases } from "@/lib/admin-api";

export default async function ContentDetailPage({ params }: { params: Promise<{ contentVersionId: string }> }) {
  const { contentVersionId } = await params;
  const [rows, reviewData] = await Promise.all([getAdminContentRows(), getAdminReviewCases()]);
  const content = rows.find((row) => row.meta === contentVersionId);

  if (!content) {
    notFound();
  }

  const contentCase = reviewData.items.find((reviewCase) => reviewCase.object_id === content.meta);

  return (
    <main className="page">
      <PageHeader
        title={String(content.title)}
        eyebrow="Content detail"
        description="Draft editing is restricted to metadata and source fixes once pre-lint begins. Published versions are immutable; edits create a new version."
        actions={<StatusBadge tone="warning">{String(content.status)}</StatusBadge>}
      />
      <section className="panel">
        <div className="review-summary">
          <div>
            <span>Source</span>
            <strong>{String(content.source ?? "")}</strong>
          </div>
          <div>
            <span>Copyright</span>
            <strong>{String(content.copyright ?? "")}</strong>
          </div>
          <div>
            <span>Action</span>
            <strong>Submit source fix, then annotation</strong>
          </div>
          <div>
            <span>Internal metadata</span>
            <strong>{content.meta}</strong>
          </div>
        </div>
        {contentCase ? <p>{contentCase.teacher_readable_reason}</p> : <p>No open ReviewCase blocks this content version.</p>}
      </section>
    </main>
  );
}
