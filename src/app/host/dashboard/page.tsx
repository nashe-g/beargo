import { HostShell } from "@/components/host/HostShell";
import { requireHost } from "@/lib/host-auth";
import { serviceDayInZone } from "@/lib/dates";
import { formatWobble } from "@/lib/stack";
import { listPlays } from "@/lib/store";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HostDashboardPage() {
  const host = await requireHost();
  const plays = await listPlays();
  const localDate = serviceDayInZone(host.timezone);
  const todayPlays = plays.filter(
    (play) => play.hostId === host.id && play.localDate === localDate,
  );
  const month = localDate.slice(0, 7);
  const monthPlays = plays.filter(
    (play) => play.hostId === host.id && play.localDate.startsWith(month),
  );
  const wobbles = todayPlays
    .map((play) => play.stackWobble)
    .filter((value): value is number => value != null);
  const bestWobble = wobbles.length === 0 ? null : Math.min(...wobbles);

  return (
    <HostShell host={host} current="/host/dashboard">
      <p className="text-sm tracking-[0.2em] uppercase text-ink-soft">
        {localDate}
      </p>
      <h1 className="mt-2 font-display text-4xl">Today</h1>
      <p className="mt-3 text-ink-soft">
        Room, tray, and trivia. Block a specific offer on Offers if it competes
        with this room.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Stat
          label="Wobbles tonight"
          value={String(
            todayPlays.filter(
              (play) => play.kind === "stack" || play.kind == null,
            ).length,
          )}
        />
        <Stat
          label="Trivia tonight"
          value={String(
            todayPlays.filter((play) => play.kind === "trivia").length,
          )}
        />
        <Stat
          label="At the bar"
          value={String(
            todayPlays.filter((play) => play.playSource === "in_bar").length,
          )}
        />
        <Stat
          label="From a share"
          value={String(
            todayPlays.filter((play) => play.playSource === "share_link").length,
          )}
        />
        <Stat label="This month" value={String(monthPlays.length)} />
      </div>

      <p className="mt-8 rounded-3xl bg-ink px-5 py-6 text-paper">
        <span className="text-sm tracking-[0.16em] uppercase text-paper/55">
          Best wobble tonight
        </span>
        <span className="mt-2 block font-display text-3xl">
          {bestWobble == null ? "Nobody yet" : formatWobble(bestWobble)}
        </span>
      </p>

      <Link
        href="/host/paws"
        className="mt-10 flex h-14 items-center justify-center rounded-full bg-ink text-paper"
      >
        Print or check your Paw
      </Link>
    </HostShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-ink/10 px-4 py-5">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
    </div>
  );
}
