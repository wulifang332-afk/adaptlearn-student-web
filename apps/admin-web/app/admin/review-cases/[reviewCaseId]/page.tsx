import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getAdminReviewCases } from "@/lib/admin-api";

export default async function ReviewCaseDetailPage({ params }: { params: Promise<{ reviewCaseId: string }> }) {
  const { reviewCaseId } = await params;
  const data = await getAdminReviewCases();
  const reviewCase = data.items.find((candidate) => candidate.review_case_id === reviewCaseId);

  if (!reviewCase) {
    notFound();
  }

  return (
    <main className="page">
      <PageHeader
        title={reviewCase.object_label}
        eyebrow="ReviewCase detail"
        description="Case owners can approve, conditionally approve, request fix, reject, block final, or reopen with reason and DecisionTrace."
        actions={<StatusBadge tone={reviewCase.severity === "BLOCK" ? "blocked" : "warning"}>{reviewCase.severity}</StatusBadge>}
      />
      <section className="panel">
        <div className="review-summary">
          <div>
            <span>Queue</span>
            <strong>{reviewCase.queue_label}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{reviewCase.status}</strong>
          </div>
          <div>
            <span>Owner</span>
            <strong>{reviewCase.owner_label}</strong>
          </div>
          <div>
            <span>Internal metadata</span>
            <strong>{reviewCase.review_case_id}</strong>
          </div>
        </div>
        <p>{reviewCase.teacher_readable_reason}</p>
      </section>
    </main>
  );
}
