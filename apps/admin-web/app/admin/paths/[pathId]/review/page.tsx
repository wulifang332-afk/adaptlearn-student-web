import { PageHeader } from "@/components/page-header";
import { PathReviewWorkspace } from "@/features/path-review/path-review-workspace";
import { getAdminPathReview } from "@/lib/admin-api";

export default async function PathReviewPage({ params }: { params: Promise<{ pathId: string }> }) {
  const { pathId } = await params;
  const data = await getAdminPathReview(pathId);

  return (
    <main className="page">
      <PageHeader
        title="Learning Path Review"
        eyebrow="Teacher final decision"
        description="Approve, modify, reject, or replan a candidate path. Every action creates DecisionTrace; publish is disabled while REVIEW/BLOCK gates remain unresolved."
      />
      <PathReviewWorkspace scope={data.scope} path={data.path} reviewCases={data.reviewCases} initialTraces={data.decisionTraces} />
    </main>
  );
}
