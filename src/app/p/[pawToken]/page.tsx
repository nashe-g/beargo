import { RoomFeed } from "@/components/scanner/RoomFeed";
import { serviceDayInZone } from "@/lib/dates";
import { roomSnapshot } from "@/lib/feed-room";
import { getPaw } from "@/lib/paws";

export const dynamic = "force-dynamic";

export default async function PawIntroPage({
  params,
  searchParams,
}: PageProps<"/p/[pawToken]">) {
  const { pawToken } = await params;
  const query = await searchParams;
  const fromRaw = Array.isArray(query.from) ? query.from[0] : query.from;
  const paw = await getPaw(pawToken);
  const initial = await roomSnapshot(paw);
  return (
    <RoomFeed
      paw={paw}
      initial={initial}
      from={fromRaw ?? null}
      serviceDay={serviceDayInZone(paw.timezone)}
    />
  );
}
