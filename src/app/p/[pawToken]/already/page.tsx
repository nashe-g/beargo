import { AlreadyConnected } from "@/components/scanner/AlreadyConnected";
import { getPaw } from "@/lib/paws";
import { todaysSponsor } from "@/lib/route-campaign";

export default async function AlreadyPage({
  params,
}: PageProps<"/p/[pawToken]/already">) {
  const { pawToken } = await params;
  const campaign = todaysSponsor(getPaw(pawToken));
  return <AlreadyConnected sponsorName={campaign?.name ?? "this company"} />;
}
