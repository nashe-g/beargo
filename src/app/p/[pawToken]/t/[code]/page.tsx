import { TableNight } from "@/components/scanner/TableNight";
import { getPaw } from "@/lib/paws";

export const dynamic = "force-dynamic";

type TableJoinPageProps = {
  params: Promise<{ pawToken: string; code: string }>;
};

export default async function TableJoinPage({ params }: TableJoinPageProps) {
  const { pawToken, code } = await params;
  const paw = await getPaw(pawToken);
  return <TableNight paw={paw} initialCode={code} />;
}
