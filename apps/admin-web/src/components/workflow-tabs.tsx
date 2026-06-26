import Link from "next/link";

export function WorkflowTabs({
  tabs,
}: {
  tabs: Array<{
    href: string;
    label: string;
  }>;
}) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <Link key={tab.href} href={tab.href}>
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
