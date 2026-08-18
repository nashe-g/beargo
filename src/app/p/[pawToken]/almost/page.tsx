import { redirect } from "next/navigation";
import { QualifyConsent } from "@/components/scanner/QualifyConsent";
import { getPaw } from "@/lib/paws";
import { todaysSponsor } from "@/lib/route-campaign";

export const dynamic = "force-dynamic";

export default async function AlmostPage({
  params,
}: PageProps<"/p/[pawToken]/almost">) {
  const { pawToken } = await params;
  const paw = await getPaw(pawToken);
  const campaign = await todaysSponsor(paw);
  if (!campaign) redirect(`/p/${paw.token}/thanks`);
  return <QualifyConsent paw={paw} campaign={campaign} />;
}
