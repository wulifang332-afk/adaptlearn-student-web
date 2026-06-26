import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";

export default function AdminLoginPage() {
  return (
    <main className="auth-stage">
      <section className="auth-card">
        <StatusBadge tone="info">Staff access preview</StatusBadge>
        <h1>AdaptLearn Admin sign in</h1>
        <p>Production will authenticate staff users and resolve organization, role, and class scope through server-validated profiles. This preview uses local demo scope until staff authentication is enabled.</p>
        <label className="field">
          <span>Email</span>
          <input value="lina.chen@example.edu" readOnly />
        </label>
        <label className="field">
          <span>Password</span>
          <input value="staff-preview" readOnly type="password" />
        </label>
        <Link href="/admin/org" className="button">
          Continue to organization scope
        </Link>
      </section>
    </main>
  );
}
