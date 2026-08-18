import { redirect } from "next/navigation";
import { QualifyConsent } from "@/components/scanner/QualifyConsent";
import { getPaw } from "@/lib/paws";
import { todaysSponsor } from "@/lib/route-campaign";

export default async function AlmostPage({
  params,
}: PageProps<"/p/[pawToken]/almost">) {
  const { pawToken } = await params;
  const paw = getPaw(pawToken);
  const campaign = todaysSponsor(paw);
  if (!campaign) redirect(`/p/${paw.token}/thanks`);
  return <QualifyConsent paw={paw} campaign={campaign} />;
}
