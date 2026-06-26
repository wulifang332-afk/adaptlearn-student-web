import {
  BookOpenText,
  Boxes,
  ClipboardCheck,
  FlaskConical,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  MonitorCheck,
  Network,
  Scale,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { activeScope } from "@/lib/mock-admin-data";
import { StatusBadge } from "./status-badge";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/content", label: "Content", icon: BookOpenText },
  { href: "/admin/taxonomy", label: "Taxonomy", icon: GitBranch },
  { href: "/admin/annotations", label: "Annotations", icon: ClipboardCheck },
  { href: "/admin/assembly", label: "Assembly", icon: Boxes },
  { href: "/admin/classes/class_g7_a/diagnosis", label: "Diagnosis", icon: UsersRound },
  { href: "/admin/paths/pth_xiaoming_u6_v3/review", label: "Path Review", icon: ListChecks },
  { href: "/admin/review-cases", label: "Review Cases", icon: ShieldCheck },
  { href: "/admin/rules", label: "Rules", icon: Scale },
  { href: "/admin/research", label: "Research", icon: FlaskConical },
  { href: "/admin/monitoring", label: "Monitoring", icon: MonitorCheck },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-app">
      <aside className="sidebar">
        <Link href="/admin" className="brand">
          <span className="brand-mark">A</span>
          <span>
            <strong>AdaptLearn</strong>
            <small>Admin Web</small>
          </span>
        </Link>
        <nav className="nav-list" aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="nav-item">
                <Icon aria-hidden="true" size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="app-main">
        <header className="scope-bar">
          <div className="scope-group">
            <span>
              <Network size={15} aria-hidden="true" />
              {activeScope.organizationName}
            </span>
            <span>{activeScope.roleLabel}</span>
            <span>{activeScope.classLabel}</span>
          </div>
          <div className="scope-actions">
            <StatusBadge tone="warning">Teacher assigned class scope</StatusBadge>
            <Link href="/admin/org" className="button button-secondary">
              Change scope
            </Link>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
