import { redirect } from "next/navigation";
import { LeadIntro } from "@/components/scanner/LeadIntro";
import { getPaw } from "@/lib/paws";
import { todaysSponsor } from "@/lib/route-campaign";

export const dynamic = "force-dynamic";

export default async function IntroPage({
  params,
  searchParams,
}: PageProps<"/p/[pawToken]/intro">) {
  const { pawToken } = await params;
  const query = await searchParams;
  const from = Array.isArray(query.from) ? query.from[0] : query.from;
  const paw = await getPaw(pawToken);
  const campaign = await todaysSponsor(paw);
  if (!campaign) redirect(`/p/${paw.token}/thanks`);
  return <LeadIntro paw={paw} campaign={campaign} from={from} />;
}
