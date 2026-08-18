import { redirect } from "next/navigation";
import { VerifyEmail } from "@/components/scanner/VerifyEmail";
import { getPaw } from "@/lib/paws";
import { verifyLead } from "@/lib/store";

export default async function VerifyPage({
  params,
  searchParams,
}: PageProps<"/p/[pawToken]/verify">) {
  const { pawToken } = await params;
  const query = await searchParams;
  const token = Array.isArray(query.t) ? query.t[0] : query.t;
  const paw = getPaw(pawToken);

  if (token) {
    const result = await verifyLead(token);
    if (result.ok) redirect(`/p/${pawToken}/almost`);
    if (result.reason === "duplicate") redirect(`/p/${pawToken}/already`);
    if (result.reason === "expired") {
      return <VerifyEmail paw={paw} linkState="expired" />;
    }
    return <VerifyEmail paw={paw} linkState="invalid" />;
  }

  return <VerifyEmail paw={paw} />;
}
