import type { StatusTone } from "@/lib/admin-types";

const toneClass: Record<StatusTone, string> = {
  neutral: "badge badge-neutral",
  info: "badge badge-info",
  success: "badge badge-success",
  warning: "badge badge-warning",
  danger: "badge badge-danger",
  blocked: "badge badge-blocked",
};

export function StatusBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: StatusTone }) {
  return <span className={toneClass[tone]}>{children}</span>;
}
