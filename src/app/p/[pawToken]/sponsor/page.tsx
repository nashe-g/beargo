import { SponsorScreen } from "@/components/scanner/SponsorScreen";
import { selectAffiliateCard } from "@/lib/affiliate";
import { getPaw } from "@/lib/paws";

export const dynamic = "force-dynamic";

export default async function SponsorPage({
  params,
}: PageProps<"/p/[pawToken]/sponsor">) {
  const { pawToken } = await params;
  const paw = await getPaw(pawToken);
  let affiliate = null;
  try {
    affiliate = await selectAffiliateCard({ hostId: paw.hostId });
  } catch {
    affiliate = null;
  }
  return <SponsorScreen paw={paw} affiliate={affiliate} />;
}
