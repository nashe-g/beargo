import { getPaw } from "@/lib/paws";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NamePage({
  params,
}: {
  params: Promise<{ pawToken: string }>;
}) {
  const { pawToken } = await params;
  const paw = await getPaw(pawToken);
  redirect(`/p/${paw.token}`);
}
