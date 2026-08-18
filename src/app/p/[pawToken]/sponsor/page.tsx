import { redirect } from "next/navigation";
import { SponsorCard } from "@/components/scanner/SponsorCard";
import { getPaw } from "@/lib/paws";
import { todaysSponsor } from "@/lib/route-campaign";

export const dynamic = "force-dynamic";

export default async function SponsorPage({
  params,
}: PageProps<"/p/[pawToken]/sponsor">) {
  const { pawToken } = await params;
  const paw = await getPaw(pawToken);
  const campaign = await todaysSponsor(paw);
  if (!campaign) redirect(`/p/${paw.token}/thanks`);
  return <SponsorCard paw={paw} campaign={campaign} />;
}
