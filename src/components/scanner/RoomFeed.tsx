"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { AffiliateCard } from "@/components/scanner/AffiliateCard";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { StampSession } from "@/components/scanner/StampSession";
import { AFFILIATE_ROOM_PLACEMENT, FEED_POST_MAX } from "@/lib/config";
import {
  FEED_REPORT_REASONS,
  type FeedPostView,
  type NearbyPostView,
  type RoomSnapshot,
} from "@/lib/feed-types";
import { pulseLine } from "@/lib/feed-pulse";
import { timeAgo } from "@/lib/feed-time";
import { formatDistance } from "@/lib/geo";
import type { PawRecord } from "@/lib/paws";
import { hubPath } from "@/lib/play-kind";

function peopleLine(count: number) {
  if (count <= 0) return "Nobody’s checked in yet.";
  if (count === 1) return "1 person here tonight";
  return `${count} people here tonight`;
}

const REPORT_LABELS: Record<(typeof FEED_REPORT_REASONS)[number], string> = {
  harassment: "Harassment",
  threat: "Threat",
  hate: "Hate",
  private_information: "Private information",
  spam: "Spam",
  sexual_harassment: "Sexual harassment",
  other: "Other",
};

export function RoomFeed({
  paw,
  initial,
  from,
}: {
  paw: PawRecord;
  initial: RoomSnapshot;
  from?: string | null;
}) {
  const [room, setRoom] = useState(initial);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<FeedPostView | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const listRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/p/${encodeURIComponent(paw.token)}/room`);
    if (!response.ok) return;
    const next = (await response.json()) as RoomSnapshot;
    setRoom(next);
  }, [paw.token]);

  useEffect(() => {
    void refresh();
    const retry = window.setTimeout(() => void refresh(), 600);
    const poll = setInterval(() => {
      void refresh();
    }, 8000);
    const clock = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      window.clearTimeout(retry);
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [refresh]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch(
        `/api/p/${encodeURIComponent(paw.token)}/room/posts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body,
            parentPostId: replyTo?.id,
          }),
        },
      );
      const payload = (await response.json()) as {
        error?: string;
        id?: string;
      };
      if (!response.ok) {
        setError(payload.error || "Couldn’t post.");
        setSending(false);
        return;
      }
      setBody("");
      setReplyTo(null);
      await refresh();
    } catch {
      setError("Couldn’t post.");
    }
    setSending(false);
  }

  async function remove(postId: string) {
    setMenuId(null);
    await fetch(
      `/api/p/${encodeURIComponent(paw.token)}/room/posts/${encodeURIComponent(postId)}`,
      { method: "DELETE" },
    );
    await refresh();
  }

  async function report(postId: string, reason: string) {
    setMenuId(null);
    await fetch(
      `/api/p/${encodeURIComponent(paw.token)}/room/posts/${encodeURIComponent(postId)}/report`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      },
    );
  }

  async function vote(postId: string, choice: "up" | "down") {
    await fetch(
      `/api/p/${encodeURIComponent(paw.token)}/room/posts/${encodeURIComponent(postId)}/vote`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: choice }),
      },
    );
    await refresh();
  }

  const sponsorAt = room.posts.length >= 2 ? 2 : room.posts.length > 0 ? 1 : -1;

  return (
    <ScannerShell homeHref={hubPath(paw.token, from)}>
      <StampSession
        pawToken={paw.token}
        event="scanned"
        from={from}
        onStamped={refresh}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="shrink-0 pb-3 text-center">
          <p className="text-sm tracking-[0.22em] text-honey uppercase">
            {paw.hostDisplayName}
          </p>
          <h1 className="mt-2 font-display text-3xl">Talk to the room</h1>
          <p className="mt-2 text-sm text-paper/70">{pulseLine(room.pulse)}</p>
          <p className="mt-1 text-sm text-paper/70">{peopleLine(room.peopleHere)}</p>
          <p className="mt-1 text-xs text-paper/45">
            {room.handle ? `You’re ${room.handle}` : "You’re in the room"}
          </p>
        </header>

        <div
          ref={listRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-3"
        >
          {room.posts.length === 0 ? (
            <p className="px-2 py-8 text-center text-base text-paper/70">
              Nobody’s said anything yet. Patio? Line? Playlist?
            </p>
          ) : null}
          {room.posts.map((post, index) => (
            <div key={post.id}>
              {index === sponsorAt && room.sponsor ? (
                <div className="mb-3">
                  <AffiliateCard
                    card={room.sponsor}
                    placement={AFFILIATE_ROOM_PLACEMENT}
                  />
                </div>
              ) : null}
              <PostCard
                post={post}
                now={now}
                menuId={menuId}
                setMenuId={setMenuId}
                onReply={() => {
                  setReplyTo(post);
                  setError("");
                }}
                onDelete={remove}
                onReport={report}
                onVote={vote}
              />
            </div>
          ))}
          {room.nearby.length > 0 ? (
            <NearbyStrip posts={room.nearby} now={now} />
          ) : null}
        </div>

        <div className="shrink-0 pt-2">
          {replyTo ? (
            <button
              type="button"
              className="mb-2 text-left text-xs text-paper/55"
              onClick={() => setReplyTo(null)}
            >
              Replying to {replyTo.handle} · cancel
            </button>
          ) : null}
          {room.canPost ? (
            <form onSubmit={submit} className="flex flex-col gap-2">
              <textarea
                value={body}
                onChange={(event) => {
                  setBody(event.target.value);
                  setError("");
                }}
                maxLength={FEED_POST_MAX}
                rows={2}
                placeholder={
                  replyTo ? "Reply to the room…" : "What’s it like in here?"
                }
                className="w-full resize-none rounded-2xl border border-paper/20 bg-paper/8 px-4 py-3 text-base text-paper outline-none placeholder:text-paper/35 focus:border-honey"
              />
              {error ? <p className="text-sm text-clay">{error}</p> : null}
              <button
                type="submit"
                disabled={sending || body.trim().length === 0}
                className="btn-honey flex h-12 items-center justify-center rounded-full bg-honey text-base font-semibold tracking-[0.12em] text-ink disabled:opacity-40"
              >
                {sending ? "Sending…" : "Post"}
              </button>
            </form>
          ) : (
            <p className="pb-2 text-center text-sm text-paper/60">
              Scan the Paw at the bar to talk. You can still read.
            </p>
          )}
          <Link
            href={hubPath(paw.token, from)}
            className="mt-3 flex h-10 items-center justify-center text-sm text-paper/45"
          >
            Tonight
          </Link>
        </div>
      </div>
    </ScannerShell>
  );
}

function PostCard({
  post,
  now,
  menuId,
  setMenuId,
  onReply,
  onDelete,
  onReport,
  onVote,
}: {
  post: FeedPostView;
  now: number;
  menuId: string | null;
  setMenuId: (id: string | null) => void;
  onReply: () => void;
  onDelete: (id: string) => void;
  onReport: (id: string, reason: string) => void;
  onVote: (id: string, vote: "up" | "down") => void;
}) {
  const open = menuId === post.id;
  return (
    <article className="rounded-2xl border border-paper/10 bg-paper/6 px-4 py-3 text-left">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-honey">{post.handle}</p>
        <p className="text-xs text-paper/40">{timeAgo(post.createdAt, now)}</p>
      </div>
      <p className="mt-2 text-base leading-relaxed text-paper/90">{post.body}</p>
      <div className="mt-2 flex items-center gap-4 text-xs text-paper/50">
        <VoteButtons post={post} onVote={onVote} />
        <button type="button" onClick={onReply}>
          Reply
        </button>
        <button type="button" onClick={() => setMenuId(open ? null : post.id)}>
          {post.mine ? "Delete" : "Report"}
        </button>
      </div>
      {open && post.mine ? (
        <button
          type="button"
          className="mt-2 text-sm text-clay"
          onClick={() => onDelete(post.id)}
        >
          Delete this
        </button>
      ) : null}
      {open && !post.mine ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {FEED_REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              className="rounded-full border border-paper/15 px-2 py-1 text-xs"
              onClick={() => onReport(post.id, reason)}
            >
              {REPORT_LABELS[reason]}
            </button>
          ))}
        </div>
      ) : null}
      {post.replies.length > 0 ? (
        <div className="mt-3 space-y-2 border-l border-paper/15 pl-3">
          {post.replies.map((reply) => (
            <div key={reply.id}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-honey">{reply.handle}</p>
                <p className="text-xs text-paper/40">
                  {timeAgo(reply.createdAt, now)}
                </p>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-paper/80">
                {reply.body}
              </p>
              <div className="mt-1">
                <VoteButtons post={reply} onVote={onVote} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function VoteButtons({
  post,
  onVote,
}: {
  post: FeedPostView;
  onVote: (id: string, vote: "up" | "down") => void;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className={post.myVote === "up" ? "text-honey" : undefined}
        onClick={() => onVote(post.id, "up")}
      >
        ↑ {post.upvoteCount}
      </button>
      <button
        type="button"
        className={post.myVote === "down" ? "text-honey" : undefined}
        onClick={() => onVote(post.id, "down")}
      >
        ↓ {post.downvoteCount}
      </button>
    </span>
  );
}

function NearbyStrip({ posts, now }: { posts: NearbyPostView[]; now: number }) {
  return (
    <section className="rounded-2xl border border-paper/10 px-4 py-3">
      <p className="font-condensed text-xs tracking-[0.18em] text-honey uppercase">
        Around here
      </p>
      <div className="mt-3 space-y-3">
        {posts.map((post) => {
          const href = post.pawToken
            ? `/p/${encodeURIComponent(post.pawToken)}/room?from=nearby`
            : null;
          const inner = (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-honey">{post.venue}</p>
                <p className="text-xs text-paper/40">
                  {formatDistance(post.miles)} · {timeAgo(post.createdAt, now)}
                </p>
              </div>
              <p className="mt-1 text-sm text-paper/80">
                {post.handle}: {post.body}
              </p>
            </>
          );
          return href ? (
            <Link key={post.id} href={href} className="block text-left">
              {inner}
            </Link>
          ) : (
            <div key={post.id}>{inner}</div>
          );
        })}
      </div>
    </section>
  );
}
