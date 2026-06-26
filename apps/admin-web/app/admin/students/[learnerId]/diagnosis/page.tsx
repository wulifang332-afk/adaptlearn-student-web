import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getAdminDiagnosisRows } from "@/lib/admin-api";

export default async function StudentDiagnosisPage({ params }: { params: Promise<{ learnerId: string }> }) {
  const { learnerId } = await params;
  const rows = await getAdminDiagnosisRows();
  const learner = rows.find((row) => row.meta === learnerId);

  if (!learner) {
    notFound();
  }

  return (
    <main className="page">
      <PageHeader
        title={`${String(learner.learner)} Diagnosis`}
        eyebrow="Learner evidence"
        description="Teacher view separates knowledge, Bloom, thinking, strategy, and evidence sufficiency. It does not collapse learners into a rank."
        actions={<Link href="/admin/paths/pth_xiaoming_u6_v3/review" className="button">Open path review</Link>}
      />
      <section className="panel">
        <div className="review-summary">
          <div>
            <span>Evidence sufficiency</span>
            <strong>{String(learner.evidence ?? "")}</strong>
          </div>
          <div>
            <span>Knowledge</span>
            <strong>{String(learner.bkt ?? "")}</strong>
          </div>
          <div>
            <span>Bloom</span>
            <strong>{String(learner.bloom ?? "")}</strong>
          </div>
          <div>
            <span>Thinking</span>
            <strong>{String(learner.thinking ?? "")}</strong>
          </div>
        </div>
        <StatusBadge tone="warning">Low-confidence labels stay tentative</StatusBadge>
      </section>
    </main>
  );
}
