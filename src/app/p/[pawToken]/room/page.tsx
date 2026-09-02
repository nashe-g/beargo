import { redirect } from "next/navigation";
import { RoomFeed } from "@/components/scanner/RoomFeed";
import { FEED_ROOM_ENABLED } from "@/lib/config";
import { roomSnapshot } from "@/lib/feed-room";
import { getPaw } from "@/lib/paws";

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
  const initial = await roomSnapshot(paw);
  return <RoomFeed paw={paw} initial={initial} from={fromRaw ?? null} />;
}
