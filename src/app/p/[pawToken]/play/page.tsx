import { QuestionPlay } from "@/components/scanner/QuestionPlay";
import { TRIVIA_ENABLED } from "@/lib/config";
import { challengeForPaw } from "@/lib/daily-challenge";
import { getPaw } from "@/lib/paws";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PlayPage({
  params,
  searchParams,
}: PageProps<"/p/[pawToken]/play">) {
  const { pawToken } = await params;
  const query = await searchParams;
  const reviewFlag = Array.isArray(query.review) ? query.review[0] : query.review;
  const review = reviewFlag === "1" || reviewFlag === "true";
  if (!TRIVIA_ENABLED) redirect(`/p/${pawToken}/result`);
  const paw = await getPaw(pawToken);
  return (
    <QuestionPlay
      paw={paw}
      challenge={await challengeForPaw(paw)}
      reviewMode={review}
    />
  );
}
