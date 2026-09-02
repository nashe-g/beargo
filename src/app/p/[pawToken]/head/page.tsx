import { TRIVIA_ENABLED } from "@/lib/config";
import { getPaw } from "@/lib/paws";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HeadPage({
  params,
}: {
  params: Promise<{ pawToken: string }>;
}) {
  const { pawToken } = await params;
  if (!TRIVIA_ENABLED) redirect(`/p/${pawToken}`);
  const paw = await getPaw(pawToken);
  redirect(`/p/${paw.token}/play`);
}
