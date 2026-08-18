import { QuestionPlay } from "@/components/scanner/QuestionPlay";
import { challengeForPaw } from "@/lib/daily-challenge";
import { getPaw } from "@/lib/paws";

export default async function PlayPage({
  params,
}: PageProps<"/p/[pawToken]/play">) {
  const { pawToken } = await params;
  const paw = getPaw(pawToken);
  return <QuestionPlay paw={paw} challenge={challengeForPaw(paw)} />;
}
