import { DashboardView } from "@/features/dashboard/dashboard-view";
import { getAdminDashboard } from "@/lib/admin-api";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboard();
  return <DashboardView data={data} />;
}
