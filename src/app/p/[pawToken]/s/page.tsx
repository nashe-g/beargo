import type { Metadata } from "next";
import Link from "next/link";
import { SharePawMark } from "@/components/share/ShareCardArt";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { CANONICAL_ORIGIN } from "@/lib/config";
import { QUESTIONS_PER_CHALLENGE } from "@/lib/questions";
import { getPaw } from "@/lib/paws";
import {
  parseShareCard,
  shareCardHeadline,
  shareCardImagePath,
  shareCardQuery,
  shareCardText,
  shareCardTitle,
} from "@/lib/share-card";
import { formatWobble } from "@/lib/stack";

export const dynamic = "force-dynamic";

type SharePageProps = {
  params: Promise<{ pawToken: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: SharePageProps): Promise<Metadata> {
  const { pawToken } = await params;
  const query = await searchParams;
  const paw = await getPaw(pawToken);
  const stats = parseShareCard(query);
  const title = shareCardTitle(paw.hostDisplayName, stats);
  const description = stats
    ? shareCardText(paw.hostDisplayName, stats)
    : `Don’t drop the drinks at ${paw.hostDisplayName}.`;
  const image = stats
    ? `${CANONICAL_ORIGIN}${shareCardImagePath(pawToken, stats)}`
    : `${CANONICAL_ORIGIN}/p/${encodeURIComponent(pawToken)}/s/card`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: stats
        ? `${CANONICAL_ORIGIN}/p/${encodeURIComponent(pawToken)}/s?${shareCardQuery(stats)}`
        : `${CANONICAL_ORIGIN}/p/${encodeURIComponent(pawToken)}`,
      siteName: "BearGo",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function SharePage({
  params,
  searchParams,
}: SharePageProps) {
  const { pawToken } = await params;
  const query = await searchParams;
  const paw = await getPaw(pawToken);
  const stats = parseShareCard(query);
  const ranked = Boolean(stats && stats.rank > 0 && stats.playerCount > 0);
  const playHref = `/p/${encodeURIComponent(pawToken)}?from=share`;

  return (
    <ScannerShell>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto py-4 text-center">
          <SharePawMark size={88} />
          <p className="mt-4 font-condensed text-sm tracking-[0.22em] text-honey">
            {paw.hostDisplayName.toUpperCase()}
          </p>
          {stats?.boardName ? (
            <p className="mt-3 font-condensed text-sm tracking-[0.18em] text-paper/70">
              {stats.boardName}
            </p>
          ) : null}
          <h1 className="mt-2 font-display leading-none">
            <span className={ranked ? "text-6xl" : "text-4xl"}>
              {shareCardHeadline(stats)}
            </span>
            {ranked && stats ? (
              <span className="text-3xl text-paper/60">
                {" "}
                of {stats.playerCount}
              </span>
            ) : null}
          </h1>
          {stats ? (
            <p className="mt-4 font-condensed text-lg tracking-[0.12em] text-paper/85">
              {stats.correctCount} / {QUESTIONS_PER_CHALLENGE} · WOBBLE{" "}
              {formatWobble(stats.stackWobble)}
            </p>
          ) : (
            <p className="mt-4 max-w-[19rem] text-lg text-paper/85">
              Don’t drop the drinks. Then beat the crowd in today’s trivia.
            </p>
          )}
          <p className="mt-6 font-condensed text-sm tracking-[0.16em] text-honey">
            THE PAW KNOWS HOW LONG YOU’D LAST
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col items-center gap-3 pt-3">
          <Link
            href={playHref}
            className="btn-honey flex h-14 w-full items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.14em] text-ink"
          >
            Ask it.
          </Link>
          <p className="text-sm text-paper/50">
            One run a night. Rank is this room, tonight.
          </p>
        </div>
      </div>
    </ScannerShell>
  );
}
