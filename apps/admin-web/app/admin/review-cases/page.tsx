import { FeatureListPage } from "@/components/feature-list-page";
import { getAdminReviewCases } from "@/lib/admin-api";

export default async function ReviewCasesPage() {
  const data = await getAdminReviewCases();

  return (
    <FeatureListPage
      title="ReviewCase / Quality Queue"
      eyebrow="REVIEW and BLOCK flow control"
      description="Resolve REVIEW/BLOCK cases across paths, submissions, media, content, annotations, taxonomy, LMS sync, and research evidence. Source flows cannot continue silently."
      guardrail="Admin can assign; owners decide"
      rows={data.rows}
      columns={[
        { key: "queue", header: "Queue" },
        { key: "item", header: "Source object" },
        { key: "severity", header: "Severity" },
        { key: "status", header: "Status" },
        { key: "owner", header: "Owner" },
        { key: "due", header: "SLA" },
      ]}
    />
  );
}
