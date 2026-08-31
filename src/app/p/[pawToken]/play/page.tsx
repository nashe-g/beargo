import { QuestionPlay } from "@/components/scanner/QuestionPlay";
import { TRIVIA_ENABLED } from "@/lib/config";
import { challengeForPaw } from "@/lib/daily-challenge";
import { getPaw } from "@/lib/paws";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PlayPage({
  params,
}: PageProps<"/p/[pawToken]/play">) {
  const { pawToken } = await params;
  // Trivia is archived from the public flow.
  if (!TRIVIA_ENABLED) redirect(`/p/${pawToken}/stack`);
  const paw = await getPaw(pawToken);
  return <QuestionPlay paw={paw} challenge={await challengeForPaw(paw)} />;
}
