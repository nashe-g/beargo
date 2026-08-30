import { PawPrint } from "@/components/paw/PawPrint";
import { pawScanUrl } from "@/lib/config";

export function HomePawSign() {
  return (
    <div className="relative mx-auto w-full max-w-[22rem] sm:max-w-sm">
      <div
        aria-hidden
        className="absolute inset-x-6 inset-y-4 -rotate-6 rounded-[2rem] bg-paper-deep/80"
      />
      <div className="relative rotate-3 rounded-[2rem] border border-ink/10 bg-pad px-7 py-8 shadow-[0_28px_60px_rgba(26,18,11,0.14)] sm:px-9 sm:py-10">
        <p className="font-condensed text-center text-xl font-semibold tracking-[0.2em] text-ink">
          SCAN THE PAW
        </p>
        <PawPrint
          scanUrl={pawScanUrl("demo")}
          className="mx-auto mt-7 h-44 w-44 text-ink sm:h-52 sm:w-52"
          label="BearGo demo paw"
        />
        <p className="mt-7 font-condensed text-center text-lg font-semibold tracking-[0.2em]">
          3 QUESTIONS
        </p>
        <p className="mt-2 text-center font-display text-2xl leading-tight">
          How do you rank here today?
        </p>
        <p className="mt-4 text-center text-sm text-ink-soft">~30 seconds</p>
      </div>
    </div>
  );
}
