import { FoundationConsolePage } from "@/components/foundation-console";
import { getFoundationPageBySlug } from "@/lib/foundation";
import { getFoundationReadinessSnapshot } from "@/lib/foundation-readiness";

export default async function FoundationHomePage() {
  const page = getFoundationPageBySlug();
  const readiness = await getFoundationReadinessSnapshot();

  if (!page) {
    return null;
  }

  return <FoundationConsolePage page={page} readiness={readiness} />;
}
