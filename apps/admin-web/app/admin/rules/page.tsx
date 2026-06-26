import { FeatureListPage } from "@/components/feature-list-page";
import { getAdminRuleRows } from "@/lib/admin-api";

export default async function RulesPage() {
  const rows = await getAdminRuleRows();

  return (
    <FeatureListPage
      title="Rules & Teacher Constraints"
      eyebrow="Path governance"
      description="Manage teacher constraints, rule versions, thresholds, release/rollback state, and replan triggers without exposing internal component weights to students."
      guardrail="Changing constraints creates a replan candidate"
      rows={rows}
      columns={[
        { key: "name", header: "Rule profile" },
        { key: "status", header: "State" },
        { key: "rollout", header: "Rollout" },
        { key: "constraints", header: "Teacher constraints" },
      ]}
    />
  );
}
