import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getAdminPackageRows } from "@/lib/admin-api";

export default async function AssemblyDetailPage({ params }: { params: Promise<{ packageId: string }> }) {
  const { packageId } = await params;
  const rows = await getAdminPackageRows();
  const unitPackage = rows.find((row) => row.meta === packageId);

  if (!unitPackage) {
    notFound();
  }

  return (
    <main className="page">
      <PageHeader
        title={String(unitPackage.title)}
        eyebrow="Package detail"
        description="Task sequences stay governed by task approval, annotation approval, Assembly Lint, version locking, and DecisionTrace on publish."
        actions={<StatusBadge tone="warning">{String(unitPackage.lint)}</StatusBadge>}
      />
      <section className="panel">
        <div className="review-summary">
          <div>
            <span>Audience</span>
            <strong>{String(unitPackage.audience ?? "")}</strong>
          </div>
          <div>
            <span>Task count</span>
            <strong>{String(unitPackage.tasks ?? "")}</strong>
          </div>
          <div>
            <span>Governed action</span>
            <strong>Run lint, resolve ReviewCase, publish locked version</strong>
          </div>
          <div>
            <span>Internal metadata</span>
            <strong>{unitPackage.meta}</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
