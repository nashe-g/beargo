import { redirect } from "next/navigation";
import { hubPath } from "@/lib/play-kind";

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
  const fromRaw = Array.isArray(query.from) ? query.from[0] : query.from;
  redirect(hubPath(pawToken, fromRaw ?? null));
}
