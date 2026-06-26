import { FeatureListPage } from "@/components/feature-list-page";
import { getAdminDashboard, getAdminDiagnosisRows } from "@/lib/admin-api";

export default async function ClassDiagnosisPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const [rows, dashboard] = await Promise.all([getAdminDiagnosisRows(classId), getAdminDashboard()]);
  const classLabel = dashboard.scope.classId === classId ? dashboard.scope.classLabel : "Class";

  return (
    <FeatureListPage
      title={`${classLabel ?? "Class"} Diagnosis`}
      eyebrow="Teacher assigned class scope"
      description="Inspect BKT, IRT, Bloom, thinking quality, strategy, evidence sufficiency, submission evidence, and path status without exact rankings."
      guardrail="Assigned class only"
      rows={rows}
      columns={[
        { key: "learner", header: "Learner" },
        { key: "evidence", header: "Evidence" },
        { key: "bkt", header: "Knowledge label" },
        { key: "bloom", header: "Bloom evidence" },
        { key: "thinking", header: "Thinking quality" },
        { key: "path", header: "Path status" },
      ]}
    />
  );
}
