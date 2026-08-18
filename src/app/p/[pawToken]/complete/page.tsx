import { redirect } from "next/navigation";
import { LeadComplete } from "@/components/scanner/LeadComplete";
import { getPaw } from "@/lib/paws";
import { todaysSponsor } from "@/lib/route-campaign";

export default async function CompletePage({
  params,
}: PageProps<"/p/[pawToken]/complete">) {
  const { pawToken } = await params;
  const paw = getPaw(pawToken);
  const campaign = todaysSponsor(paw);
  if (!campaign) redirect(`/p/${paw.token}/thanks`);
  return <LeadComplete paw={paw} campaign={campaign} />;
}
