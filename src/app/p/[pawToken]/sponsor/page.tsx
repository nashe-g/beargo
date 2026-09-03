import { redirect } from "next/navigation";
import { hubPath } from "@/lib/play-kind";

export const dynamic = "force-dynamic";

export default async function SponsorPage({
  params,
}: PageProps<"/p/[pawToken]/sponsor">) {
  const { pawToken } = await params;
  redirect(hubPath(pawToken));
}
