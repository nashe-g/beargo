import { BearGuide } from "@/components/bear/BearGuide";
import { PLAY_ROUNDS, playRoundList, type PlayRoundId } from "@/lib/play-rounds";

export function RoundIntro({
  round,
  kicker,
  onGo,
}: {
  round: PlayRoundId;
  kicker: string;
  onGo: () => void;
}) {
  const list = playRoundList();
  const here = list.findIndex((row) => row.id === round);
  const copy = list[here] ?? PLAY_ROUNDS[round];
  const coming = list.slice(here + 1);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-between overflow-y-auto py-4 text-center">
      <div className="flex flex-col items-center gap-3">
        <BearGuide state="arrive" size="md" />
        <p className="font-condensed text-sm tracking-[0.22em] text-honey">
          {copy.n} / {String(list.length).padStart(2, "0")} · {copy.name}
        </p>
        <p className="text-sm text-paper/55">{kicker}</p>
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">
          {copy.title}
        </h1>
        <p className="max-w-[20rem] text-base text-paper/80 sm:text-lg">
          {copy.body}
        </p>
        {coming.length > 0 ? (
          <p className="mt-2 text-sm text-honey/85">
            After this: {coming.map((row) => row.name.toLowerCase()).join(", then ")}.
          </p>
        ) : (
          <p className="mt-2 text-sm text-honey/85">Then you see the board.</p>
        )}
      </div>
      <button
        type="button"
        onClick={onGo}
        className="btn-honey mt-8 flex h-14 w-full items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.14em] text-ink"
      >
        {copy.cta}
      </button>
    </div>
  );
}
