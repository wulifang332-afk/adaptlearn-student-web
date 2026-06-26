import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getAdminRuleRows } from "@/lib/admin-api";

export default async function RuleDetailPage({ params }: { params: Promise<{ ruleProfileId: string }> }) {
  const { ruleProfileId } = await params;
  const rows = await getAdminRuleRows();
  const rule = rows.find((row) => row.meta === ruleProfileId);

  if (!rule) {
    notFound();
  }

  return (
    <main className="page">
      <PageHeader
        title={String(rule.name)}
        eyebrow="Rule profile"
        description="Researchers draft rule profiles; admins release or roll back within approved tenant flags. Teachers manage class constraints."
        actions={<StatusBadge tone="success">{String(rule.status)}</StatusBadge>}
      />
      <section className="panel">
        <div className="review-summary">
          <div>
            <span>Rollout</span>
            <strong>{String(rule.rollout ?? "")}</strong>
          </div>
          <div>
            <span>Constraints</span>
            <strong>{String(rule.constraints ?? "")}</strong>
          </div>
          <div>
            <span>Release action</span>
            <strong>DecisionTrace and audit required</strong>
          </div>
          <div>
            <span>Internal metadata</span>
            <strong>{rule.meta}</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
