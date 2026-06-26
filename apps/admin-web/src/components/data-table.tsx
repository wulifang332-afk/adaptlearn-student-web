import Link from "next/link";
import type { TableColumn } from "@/lib/admin-types";

type RowWithHref = {
  href?: string;
  meta?: string;
};

export function DataTable<T extends RowWithHref>({
  columns,
  rows,
  emptyLabel = "No rows in this scoped view.",
}: {
  columns: TableColumn<T>[];
  rows: T[];
  emptyLabel?: string;
}) {
  return (
    <div className="table-shell">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className={column.className}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="empty-cell">
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.meta ?? index}>
                {columns.map((column) => (
                  <td key={String(column.key)} className={column.className}>
                    {column.render ? column.render(row) : renderCell(row, column.key)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function renderCell<T extends RowWithHref>(row: T, key: keyof T | string) {
  const value = row[key as keyof T];

  if (key === "item" || key === "title" || key === "task" || key === "name" || key === "claim" || key === "learner") {
    return (
      <span className="primary-cell">
        {row.href ? <Link href={row.href}>{String(value)}</Link> : String(value)}
        {row.meta ? <small>{row.meta}</small> : null}
      </span>
    );
  }

  return String(value ?? "");
}
