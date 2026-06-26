import { notFound } from "next/navigation";
import { FoundationConsolePage } from "@/components/foundation-console";
import { getFoundationPageBySlug } from "@/lib/foundation";
import { getFoundationReadinessSnapshot } from "@/lib/foundation-readiness";

export default async function FoundationSectionPage({ params }: { params: Promise<{ section: string[] }> }) {
  const readinessPromise = getFoundationReadinessSnapshot();
  const { section } = await params;
  const page = getFoundationPageBySlug(section);

  if (!page) {
    notFound();
  }

  const readiness = await readinessPromise;

  return <FoundationConsolePage page={page} readiness={readiness} />;
}
