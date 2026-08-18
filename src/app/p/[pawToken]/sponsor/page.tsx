import { redirect } from "next/navigation";
import { SponsorCard } from "@/components/scanner/SponsorCard";
import { getPaw } from "@/lib/paws";
import { todaysSponsor } from "@/lib/route-campaign";

export default async function SponsorPage({
  params,
}: PageProps<"/p/[pawToken]/sponsor">) {
  const { pawToken } = await params;
  const paw = getPaw(pawToken);
  const campaign = todaysSponsor(paw);
  if (!campaign) redirect(`/p/${paw.token}/thanks`);
  return <SponsorCard paw={paw} campaign={campaign} />;
}
