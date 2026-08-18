import { redirect } from "next/navigation";
import { CompanyHook } from "@/components/scanner/CompanyHook";
import { getPaw } from "@/lib/paws";
import { todaysSponsor } from "@/lib/route-campaign";

export const dynamic = "force-dynamic";

export default async function CompanyPage({
  params,
}: PageProps<"/p/[pawToken]/company">) {
  const { pawToken } = await params;
  const paw = await getPaw(pawToken);
  if (!(await todaysSponsor(paw))) redirect(`/p/${paw.token}/thanks`);
  return <CompanyHook paw={paw} />;
}
