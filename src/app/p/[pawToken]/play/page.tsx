import { QuestionPlay } from "@/components/scanner/QuestionPlay";
import { TRIVIA_ENABLED } from "@/lib/config";
import { challengeForPaw } from "@/lib/daily-challenge";
import { getPaw } from "@/lib/paws";
import { deviceKeyFromCookies } from "@/lib/scan-session";
import { rankedPlayForDevice } from "@/lib/store";
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
  if (!TRIVIA_ENABLED) redirect(`/p/${pawToken}`);
  const paw = await getPaw(pawToken);
  if (!review && paw.token !== "demo") {
    const deviceKey = await deviceKeyFromCookies();
    if (deviceKey && (await rankedPlayForDevice(paw, deviceKey, "trivia"))) {
      redirect(`/p/${pawToken}/result?game=trivia`);
    }
  }
  return (
    <QuestionPlay
      paw={paw}
      challenge={await challengeForPaw(paw)}
      reviewMode={review}
    />
  );
}
