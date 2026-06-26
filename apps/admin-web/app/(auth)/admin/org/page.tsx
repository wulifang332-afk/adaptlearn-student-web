import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { alternateScopes } from "@/lib/mock-admin-data";

export default function AdminOrgPage() {
  return (
    <main className="auth-stage">
      <section className="auth-card">
        <StatusBadge tone="warning">Server-validated scope placeholder</StatusBadge>
        <h1>Choose active organization, role, and class scope</h1>
        <p>Teachers must choose an assigned class scope before entering the dashboard. Researchers and experts enter content/review scopes without broad student data access.</p>
        {alternateScopes.map((scope) => (
          <Link href="/admin" key={`${scope.role}-${scope.classId ?? "review"}`} className="scope-option">
            <strong>
              {scope.organizationName} · {scope.roleLabel}
            </strong>
            <small>{scope.classLabel ?? scope.reviewScope}</small>
          </Link>
        ))}
      </section>
    </main>
  );
}
