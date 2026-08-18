import { ThanksScreen } from "@/components/scanner/ThanksScreen";

export default async function ThanksPage({
  searchParams,
}: PageProps<"/p/[pawToken]/thanks">) {
  const query = await searchParams;
  const reason = Array.isArray(query.reason) ? query.reason[0] : query.reason;
  return <ThanksScreen reason={reason} />;
}
