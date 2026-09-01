import { BrainInvite } from "@/components/scanner/BrainInvite";
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
  if (!TRIVIA_ENABLED) redirect(`/p/${pawToken}/result`);
  const paw = await getPaw(pawToken);
  return <BrainInvite paw={paw} />;
}
