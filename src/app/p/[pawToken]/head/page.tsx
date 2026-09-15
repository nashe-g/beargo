import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HeadPage({
  params,
}: {
  params: Promise<{ pawToken: string }>;
}) {
  const { pawToken } = await params;
  redirect(`/p/${pawToken}`);
}
