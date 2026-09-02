import { redirect } from "next/navigation";
import { RoomFeed } from "@/components/scanner/RoomFeed";
import { FEED_ROOM_ENABLED } from "@/lib/config";
import { roomSnapshot } from "@/lib/feed-room";
import { getPaw } from "@/lib/paws";
import { inferPlaySource } from "@/lib/play-source";
import { ensureScanSession } from "@/lib/scan-session";

export const dynamic = "force-dynamic";

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ pawToken: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { pawToken } = await params;
  const query = await searchParams;
  if (!FEED_ROOM_ENABLED) redirect(`/p/${pawToken}`);
  const paw = await getPaw(pawToken);
  const fromRaw = Array.isArray(query.from) ? query.from[0] : query.from;
  await ensureScanSession(
    paw,
    fromRaw != null
      ? { entrySource: inferPlaySource(paw.token, fromRaw) }
      : {},
  );
  const initial = await roomSnapshot(paw);
  return <RoomFeed paw={paw} initial={initial} from={fromRaw ?? null} />;
}
