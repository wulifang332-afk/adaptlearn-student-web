import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getAdminAnnotationRows, getAdminReviewCases } from "@/lib/admin-api";

export default async function AnnotationDetailPage({ params }: { params: Promise<{ annotationId: string }> }) {
  const { annotationId } = await params;
  const [rows, reviewData] = await Promise.all([getAdminAnnotationRows(), getAdminReviewCases()]);
  const annotation = rows.find((row) => row.meta === annotationId);

  if (!annotation) {
    notFound();
  }

  const annotationCase = reviewData.items.find((reviewCase) => reviewCase.object_id === annotation.meta);
  const lint = String(annotation.lint ?? "INFO");

  return (
    <main className="page">
      <PageHeader
        title={String(annotation.task)}
        eyebrow="Annotation detail"
        description="Researchers can accept, modify, return, block, request taxonomy review, or escalate high-risk cases to an expert."
        actions={<StatusBadge tone={lint === "BLOCK" ? "blocked" : lint === "REVIEW" ? "warning" : "info"}>{lint}</StatusBadge>}
      />
      <section className="panel">
        <div className="review-summary">
          <div>
            <span>Candidate labels</span>
            <strong>{String(annotation.candidate ?? "")}</strong>
          </div>
          <div>
            <span>Confidence</span>
            <strong>{String(annotation.confidence ?? "")}</strong>
          </div>
          <div>
            <span>ReviewCase</span>
            <strong>{annotationCase?.review_case_id ?? "No open case"}</strong>
          </div>
          <div>
            <span>Internal metadata</span>
            <strong>{annotation.meta}</strong>
          </div>
        </div>
        <p>{annotationCase?.teacher_readable_reason ?? "No unresolved blocking case for this annotation."}</p>
      </section>
    </main>
  );
}
