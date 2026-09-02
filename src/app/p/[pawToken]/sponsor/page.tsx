import { SponsorScreen } from "@/components/scanner/SponsorScreen";
import { selectAffiliateCard } from "@/lib/affiliate";
import { getPaw } from "@/lib/paws";
import { parsePlayKind } from "@/lib/play-kind";

export const dynamic = "force-dynamic";

export default async function SponsorPage({
  params,
  searchParams,
}: {
  params: Promise<{ pawToken: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { pawToken } = await params;
  const query = await searchParams;
  const gameRaw = Array.isArray(query.game) ? query.game[0] : query.game;
  const kind = parsePlayKind(gameRaw) ?? "stack";
  const paw = await getPaw(pawToken);
  let affiliate = null;
  try {
    affiliate = await selectAffiliateCard({ hostId: paw.hostId });
  } catch {
    affiliate = null;
  }
  return <SponsorScreen paw={paw} kind={kind} affiliate={affiliate} />;
}
