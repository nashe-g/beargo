import { PawPrint } from "@/components/paw/PawPrint";
import { pawScanUrl } from "@/lib/config";

export function HomePawSign() {
  return (
    <div className="relative mx-auto w-full max-w-[22rem] sm:max-w-sm">
      <div
        aria-hidden
        className="absolute inset-x-6 inset-y-4 -rotate-6 rounded-[2rem] bg-paper-deep/80"
      />
      <div className="relative rotate-3 rounded-[2rem] border border-ink/10 bg-pad px-6 py-8 shadow-[0_28px_60px_rgba(26,18,11,0.14)] sm:px-8 sm:py-9">
        <p className="text-center font-condensed text-[1.05rem] font-semibold leading-[1.15] tracking-[0.04em] text-ink sm:text-lg">
          THE PAW KNOWS HOW LONG YOU’D LAST
          <br />
          AS A BARTENDER.
        </p>
        <PawPrint
          scanUrl={pawScanUrl("demo")}
          className="mx-auto mt-4 h-44 w-44 text-ink sm:mt-5 sm:h-52 sm:w-52"
          label="BearGo demo paw"
        />
        <p className="mt-4 font-condensed text-center text-3xl font-semibold tracking-[0.16em] sm:mt-5">
          ASK IT.
        </p>
      </div>
    </div>
  );
}
