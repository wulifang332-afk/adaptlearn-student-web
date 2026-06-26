import { PathScreen } from "@/components/screens";

export default async function StudentPathPage({ params }: { params: Promise<{ pathId: string }> }) {
  const { pathId } = await params;
  return <PathScreen pathId={pathId} />;
}
