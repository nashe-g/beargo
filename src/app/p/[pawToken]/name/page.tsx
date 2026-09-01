import { NameBoard } from "@/components/scanner/NameBoard";
import { getPaw } from "@/lib/paws";

export const dynamic = "force-dynamic";

export default async function NamePage({
  params,
}: {
  params: Promise<{ pawToken: string }>;
}) {
  const { pawToken } = await params;
  const paw = await getPaw(pawToken);
  return <NameBoard paw={paw} />;
}
