import { DataTable } from "./data-table";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";

type GenericRow = {
  href?: string;
  meta?: string;
  [key: string]: string | number | undefined;
};

export function FeatureListPage({
  title,
  description,
  eyebrow,
  rows,
  columns,
  guardrail,
}: {
  title: string;
  description: string;
  eyebrow: string;
  rows: GenericRow[];
  columns: Array<{ key: string; header: string }>;
  guardrail?: string;
}) {
  return (
    <main className="page">
      <PageHeader
        title={title}
        description={description}
        eyebrow={eyebrow}
        actions={guardrail ? <StatusBadge tone="info">{guardrail}</StatusBadge> : null}
      />
      <DataTable columns={columns} rows={rows} />
    </main>
  );
}
