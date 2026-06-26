import { FoundationShell } from "@/components/foundation-console";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <FoundationShell>{children}</FoundationShell>;
}
