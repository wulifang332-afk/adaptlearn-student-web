import { TaskScreen } from "@/components/screens";

export default async function StudentTaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  return <TaskScreen taskId={taskId} />;
}
