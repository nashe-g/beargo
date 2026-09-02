import { AdminShell, Stat, StatusPill } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { FEED_MODERATION_SHADOW } from "@/lib/config";
import {
  feedShadowSummary,
  recentWouldBlocks,
} from "@/lib/feed-moderation-stats";
import { listModeratedPosts } from "@/lib/feed-store";
import { isoRequired } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminRoomPage() {
  await requireAdmin();
  const [posts, shadow, wouldBlocks] = await Promise.all([
    listModeratedPosts(),
    feedShadowSummary(),
    recentWouldBlocks(8),
  ]);

  return (
    <AdminShell current="/admin/room">
      <h1 className="font-display text-4xl">Room</h1>
      <p className="mt-3 text-ink-soft">
        Venue thread. Hosts cannot delete criticism. Hidden posts were
        auto-removed after reports; blocked never went public.
        {FEED_MODERATION_SHADOW
          ? " Omni enforcement is still shadow — PII, threats, and sexual/minors already block."
          : " Full policy is live."}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Moderation rows" value={String(shadow.total)} />
        <Stat
          label="Would block or intervene"
          value={`${shadow.wouldBlockPct}%`}
          note={`${shadow.wouldBlock} of ${shadow.total}`}
        />
        <Stat
          label="Shadowed (allowed live)"
          value={String(shadow.shadowed)}
        />
        <Stat
          label="Layer 1 PII corpus"
          value={shadow.piiReady ? "Pass" : "Fail"}
          note={
            shadow.piiReady
              ? "Must-allow stayed clean; must-block PII caught."
              : "Do not flip the shadow flag."
          }
        />
      </div>

      {wouldBlocks.length > 0 ? (
        <div className="mt-8">
          <h2 className="font-display text-2xl">Would have blocked</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Stored full-policy blocks. In shadow they may still have published
            unless they were PII, threats, or sexual/minors.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {wouldBlocks.map((row) => (
              <li key={row.id} className="rounded-2xl border border-ink/10 px-4 py-3">
                <span className="font-mono text-xs text-ink-soft">
                  {row.wouldDecision} · {row.decisionReason}
                </span>
                <span className="ml-2 text-ink-soft">post {row.postId.slice(0, 8)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="text-ink-soft">
            <tr>
              <th className="pb-3 font-normal">When</th>
              <th className="pb-3 font-normal">Host</th>
              <th className="pb-3 font-normal">Handle</th>
              <th className="pb-3 font-normal">Status</th>
              <th className="pb-3 font-normal">Post</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-t border-ink/10 align-top">
                <td className="py-3 font-mono text-xs text-ink-soft">
                  {isoRequired(post.createdAt).replace("T", " ").slice(0, 16)}
                </td>
                <td className="py-3">{post.hostId}</td>
                <td className="py-3">{post.handleSnapshot}</td>
                <td className="py-3">
                  <StatusPill status={post.status} />
                </td>
                <td className="max-w-sm py-3">{post.body}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
