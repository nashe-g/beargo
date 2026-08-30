import { BearGuide } from "@/components/bear/BearGuide";
import { PLAY_ROUNDS, playRoundList, type PlayRoundId } from "@/lib/play-rounds";

export function RoundIntro({
  round,
  kicker,
  onGo,
}: {
  round: PlayRoundId;
  kicker?: string;
  onGo: () => void;
}) {
  const list = playRoundList();
  const here = list.findIndex((row) => row.id === round);
  const copy = list[here] ?? PLAY_ROUNDS[round];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto py-4 text-center">
        <BearGuide state="arrive" size="md" />
        <p className="mt-3 font-condensed text-sm tracking-[0.22em] text-honey">
          {copy.n} / {String(list.length).padStart(2, "0")} · {copy.name}
        </p>
        {kicker ? (
          <p className="mt-3 max-w-[20rem] text-base text-honey/90">{kicker}</p>
        ) : null}
        <h1 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
          {copy.title}
        </h1>
        <p className="mt-3 max-w-[20rem] text-base text-paper/80 sm:text-lg">
          {copy.body}
        </p>
      </div>
      <button
        type="button"
        onClick={onGo}
        className="btn-honey mt-4 flex h-14 w-full shrink-0 items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.14em] text-ink"
      >
        {copy.cta}
      </button>
    </div>
  );
}
