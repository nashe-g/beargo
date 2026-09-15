import { TableNight } from "@/components/scanner/TableNight";
import { getPaw } from "@/lib/paws";

export const dynamic = "force-dynamic";

export default async function PawIntroPage({
  params,
  searchParams,
}: PageProps<"/p/[pawToken]">) {
  const { pawToken } = await params;
  const query = await searchParams;
  const fromRaw = Array.isArray(query.from) ? query.from[0] : query.from;
  const paw = await getPaw(pawToken);
  return <TableNight paw={paw} from={fromRaw ?? null} />;
}
