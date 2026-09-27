"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { StampSession, type StampResult } from "@/components/scanner/StampSession";
import { FEED_POST_MAX } from "@/lib/config";
import {
  FEED_REPORT_REASONS,
  type FeedPostView,
  type NearbyPostView,
  type RoomSnapshot,
} from "@/lib/feed-types";
import { timeAgo } from "@/lib/feed-time";
import { formatDistance } from "@/lib/geo";
import type { PawRecord } from "@/lib/paws";

const NEAR_BOTTOM_PX = 96;
const CLUSTER_MS = 5 * 60_000;
const STAMP_MS = 10 * 60_000;

const REPORT_LABELS: Record<(typeof FEED_REPORT_REASONS)[number], string> = {
  harassment: "Harassment",
  threat: "Threat",
  hate: "Hate",
  private_information: "Private information",
  spam: "Spam",
  sexual_harassment: "Sexual harassment",
  other: "Other",
};

function hereLine(count: number) {
  if (count <= 0) return "Nobody here yet";
  if (count === 1) return "1 here";
  return `${count} here`;
}

function gapMs(earlier: string, later: string) {
  return new Date(later).getTime() - new Date(earlier).getTime();
}

function insertPosted(room: RoomSnapshot, post: FeedPostView): RoomSnapshot {
  if (post.parentId) {
    return {
      ...room,
      posts: room.posts.map((item) =>
        item.id === post.parentId
          ? {
              ...item,
              replyCount: Math.max(item.replyCount, item.replies.length) + 1,
              replies: item.replies.some((reply) => reply.id === post.id)
                ? item.replies
                : [...item.replies, post],
            }
          : item,
      ),
    };
  }
  if (room.posts.some((item) => item.id === post.id)) return room;
  return { ...room, posts: [post, ...room.posts] };
}

export function RoomFeed({
  paw,
  initial,
  from,
  asReward = false,
}: {
  paw: PawRecord;
  initial: RoomSnapshot;
  from?: string | null;
  asReward?: boolean;
}) {
  const [room, setRoom] = useState(initial);
  const [handle, setHandle] = useState(initial.handle);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<FeedPostView | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [showNearby, setShowNearby] = useState(false);
  const [showLatest, setShowLatest] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [keyboardInset, setKeyboardInset] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);
  const focusId = useRef<string | null>(null);
  const smoothScroll = useRef(false);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/p/${encodeURIComponent(paw.token)}/room`);
    if (!response.ok) return;
    const next = (await response.json()) as RoomSnapshot;
    setRoom(next);
    if (next.handle) setHandle(next.handle);
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

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const sync = () => {
      const inset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      setKeyboardInset(inset);
    };
    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
    };
  }, []);

  const syncEdge = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const near =
      list.scrollHeight - list.scrollTop - list.clientHeight < NEAR_BOTTOM_PX;
    stickToBottom.current = near;
    setShowLatest(!near && list.scrollHeight > list.clientHeight + 8);
  }, []);

  const jumpToLatest = useCallback((smooth = false) => {
    const list = listRef.current;
    if (!list) return;
    stickToBottom.current = true;
    setShowLatest(false);
    list.scrollTo({
      top: list.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    if (keyboardInset <= 0 || !stickToBottom.current) return;
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [keyboardInset]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const id = focusId.current;
    if (id) {
      const node = list.querySelector(`[data-post-id="${CSS.escape(id)}"]`);
      focusId.current = null;
      if (node) {
        node.scrollIntoView({
          block: "nearest",
          behavior: smoothScroll.current ? "smooth" : "auto",
        });
        smoothScroll.current = false;
        syncEdge();
        return;
      }
    }
    if (stickToBottom.current) {
      list.scrollTop = list.scrollHeight;
      setShowLatest(false);
    }
  }, [room.posts, syncEdge]);

  function resizeComposer() {
    const field = composerRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, 128)}px`;
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (sending) return;
    const text = body.trim();
    if (!text) return;
    setSending(true);
    setError("");
    const parent = replyTo;
    try {
      const response = await fetch(
        `/api/p/${encodeURIComponent(paw.token)}/room/posts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body: text,
            parentPostId: parent?.id,
          }),
        },
      );
      const payload = (await response.json()) as FeedPostView & {
        error?: string;
      };
      if (!response.ok) {
        setError(payload.error || "Couldn’t send.");
        setSending(false);
        return;
      }
      setBody("");
      setReplyTo(null);
      if (composerRef.current) {
        composerRef.current.style.height = "auto";
      }
      const latestTop = room.posts[0]?.id;
      stickToBottom.current = !parent || parent.id === latestTop;
      if (parent) {
        setExpanded((prev) => new Set(prev).add(parent.id));
      }
      focusId.current = payload.id;
      smoothScroll.current = true;
      setRoom((prev) => insertPosted(prev, payload));
      await refresh();
    } catch {
      setError("Couldn’t send.");
    }
    setSending(false);
  }

  function onComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    void submit();
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

  const onStamped = useCallback(
    (result: StampResult) => {
      if (result.handle) setHandle(result.handle);
      void refresh();
    },
    [refresh],
  );

  function startReply(post: FeedPostView) {
    setReplyTo(post);
    setError("");
    setExpanded((prev) => new Set(prev).add(post.id));
    window.setTimeout(() => composerRef.current?.focus(), 0);
  }

  const posts = [...room.posts].reverse();

  return (
    <ScannerShell>
      <StampSession
        pawToken={paw.token}
        event="scanned"
        from={from}
        onStamped={onStamped}
      />
      <div
        className="flex min-h-0 flex-1 flex-col"
        style={keyboardInset ? { paddingBottom: keyboardInset } : undefined}
      >
        <header className="flex shrink-0 items-baseline justify-between gap-3 pb-2">
          <div className="min-w-0">
            <p className="truncate text-sm tracking-[0.18em] text-honey uppercase">
              {paw.hostDisplayName}
            </p>
            <p className="mt-0.5 text-xs text-paper/50">
              Chat · {hereLine(room.peopleHere)}
            </p>
          </div>
          <p className="shrink-0 text-xs text-paper/45">
            {handle ? `You’re ${handle}` : "You’re in"}
          </p>
        </header>

        {room.nearby.length > 0 ? (
          <div className="flex shrink-0 items-center gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setShowNearby((open) => !open)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${
                showNearby
                  ? "border-honey/50 bg-honey/15 text-honey"
                  : "border-paper/15 text-paper/70"
              }`}
            >
              Around
            </button>
          </div>
        ) : null}

        {showNearby && room.nearby.length > 0 ? (
          <div className="mb-2 max-h-36 shrink-0 overflow-y-auto border-b border-paper/10 pb-2">
            <NearbyStrip posts={room.nearby} now={now} />
          </div>
        ) : null}

        <div className="relative min-h-0 flex-1">
          <div
            ref={listRef}
            className="absolute inset-0 overflow-y-auto overscroll-contain"
            onScroll={syncEdge}
          >
            <div className="flex min-h-full flex-col justify-end gap-0.5 pb-2">
              {posts.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-paper/55">
                  {asReward
                    ? handle
                      ? `Chat for this bar. You’re ${handle}. Your real name stays off this screen.`
                      : "Chat for this bar. You post under a bar name, not your own."
                    : "Say something."}
                </p>
              ) : null}
              {posts.map((post, index) => {
                const prev = posts[index - 1];
                const stamp = !prev || gapMs(prev.createdAt, post.createdAt) >= STAMP_MS;
                const clustered =
                  Boolean(prev) &&
                  !stamp &&
                  prev.authorKind === "human" &&
                  post.authorKind === "human" &&
                  prev.handle === post.handle &&
                  gapMs(prev.createdAt, post.createdAt) < CLUSTER_MS;
                return (
                  <div key={post.id}>
                    {stamp ? (
                      <p className="py-2 text-center text-[11px] tracking-wide text-paper/35">
                        {timeAgo(post.createdAt, now)}
                      </p>
                    ) : null}
                    <PostLine
                      post={post}
                      now={now}
                      clustered={clustered}
                      menuId={menuId}
                      setMenuId={setMenuId}
                      activeId={activeId}
                      setActiveId={setActiveId}
                      threadOpen={expanded.has(post.id)}
                      onExpand={() =>
                        setExpanded((prevSet) => new Set(prevSet).add(post.id))
                      }
                      onReply={() => startReply(post)}
                      onDelete={remove}
                      onReport={report}
                      onVote={vote}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          {showLatest ? (
            <button
              type="button"
              className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-honey px-3 py-1 text-xs font-semibold text-ink shadow-[0_8px_20px_rgba(232,163,26,0.35)]"
              onClick={() => jumpToLatest(true)}
            >
              Latest
            </button>
          ) : null}
        </div>

        <div className="shrink-0 pt-2">
          {replyTo ? (
            <div className="mb-2 flex items-start gap-2 rounded-2xl border border-honey/25 bg-honey/10 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-honey">{replyTo.handle}</p>
                <p className="truncate text-sm text-paper/65">{replyTo.body}</p>
              </div>
              <button
                type="button"
                className="shrink-0 px-1 text-sm text-paper/45"
                onClick={() => setReplyTo(null)}
                aria-label="Cancel reply"
              >
                ✕
              </button>
            </div>
          ) : null}
          {room.canPost ? (
            <form onSubmit={submit} className="flex items-end gap-2">
              <textarea
                ref={composerRef}
                value={body}
                onChange={(event) => {
                  setBody(event.target.value);
                  setError("");
                  window.requestAnimationFrame(resizeComposer);
                }}
                onKeyDown={onComposerKey}
                maxLength={FEED_POST_MAX}
                rows={1}
                enterKeyHint="send"
                autoComplete="off"
                placeholder={replyTo ? "Reply…" : "Say something"}
                className="max-h-32 min-h-11 flex-1 resize-none rounded-[1.35rem] border border-paper/20 bg-paper/8 px-4 py-2.5 text-base leading-snug text-paper outline-none placeholder:text-paper/35 focus:border-honey"
              />
              <button
                type="submit"
                disabled={sending || body.trim().length === 0}
                aria-label="Send"
                className="btn-honey flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-honey text-ink disabled:opacity-35"
              >
                <SendIcon />
              </button>
            </form>
          ) : (
            <p className="pb-2 text-center text-sm text-paper/60">
              Scan the Paw at the bar to talk. You can still read.
            </p>
          )}
          {error ? <p className="mt-1.5 text-sm text-clay">{error}</p> : null}
        </div>
      </div>
    </ScannerShell>
  );
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
      aria-hidden
    >
      <path d="M3.4 11.2 20.1 3.7c.7-.3 1.4.4 1.1 1.1l-7.5 16.7c-.3.7-1.3.7-1.6 0l-2.6-6.3-6.3-2.6c-.7-.3-.7-1.3 0-1.6Z" />
    </svg>
  );
}

function PostLine({
  post,
  now,
  clustered,
  menuId,
  setMenuId,
  activeId,
  setActiveId,
  threadOpen,
  onExpand,
  onReply,
  onDelete,
  onReport,
  onVote,
}: {
  post: FeedPostView;
  now: number;
  clustered: boolean;
  menuId: string | null;
  setMenuId: (id: string | null) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  threadOpen: boolean;
  onExpand: () => void;
  onReply: () => void;
  onDelete: (id: string) => void;
  onReport: (id: string, reason: string) => void;
  onVote: (id: string, vote: "up" | "down") => void;
}) {
  const open = menuId === post.id;
  const active = activeId === post.id;
  const house = post.authorKind === "house";

  return (
    <article
      data-post-id={post.id}
      className={`text-left ${
        house
          ? "px-1 py-1.5"
          : `rounded-2xl px-2.5 py-1.5 ${
              post.mine ? "bg-paper/8" : ""
            } ${clustered ? "pt-0.5" : ""}`
      }`}
    >
      {clustered && !house ? null : (
        <div className="flex items-baseline justify-between gap-3">
          <p
            className={`text-sm font-semibold ${
              house ? "text-honey/90" : "text-honey"
            }`}
          >
            {post.handle}
          </p>
          {house ? (
            <p className="text-[11px] text-paper/35">{timeAgo(post.createdAt, now)}</p>
          ) : null}
        </div>
      )}
      <button
        type="button"
        className="mt-0.5 block w-full text-left"
        onClick={() => setActiveId(active ? null : post.id)}
      >
        <p
          className={`leading-relaxed ${
            house ? "text-[15px] text-paper/80" : "text-[15px] text-paper/92"
          }`}
        >
          {post.body}
        </p>
      </button>
      <div className="mt-1 flex items-center gap-3 text-[11px] text-paper/40">
        <button type="button" onClick={onReply}>
          Reply
        </button>
        {active ? <VoteButtons post={post} onVote={onVote} /> : null}
        {house ? null : (
          <button type="button" onClick={() => setMenuId(open ? null : post.id)}>
            {post.mine ? "Delete" : "Report"}
          </button>
        )}
      </div>
      {open && post.mine ? (
        <button
          type="button"
          className="mt-1.5 text-sm text-clay"
          onClick={() => onDelete(post.id)}
        >
          Delete this
        </button>
      ) : null}
      {open && !post.mine ? (
        <div className="mt-1.5 flex flex-wrap gap-2">
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
      <ThreadReplies
        replies={post.replies}
        open={threadOpen}
        now={now}
        onExpand={onExpand}
        onVote={onVote}
        activeId={activeId}
        setActiveId={setActiveId}
      />
    </article>
  );
}

function ThreadReplies({
  replies,
  open,
  now,
  onExpand,
  onVote,
  activeId,
  setActiveId,
}: {
  replies: FeedPostView[];
  open: boolean;
  now: number;
  onExpand: () => void;
  onVote: (id: string, vote: "up" | "down") => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}) {
  if (replies.length === 0) return null;
  const latest = replies[replies.length - 1];
  const hidden = replies.length - 1;
  const showAll = open || replies.length === 1;
  const visible = showAll ? replies : [latest];

  return (
    <div className="mt-2 space-y-2 border-l border-paper/15 pl-3">
      {!showAll && hidden > 0 ? (
        <button
          type="button"
          className="text-xs font-medium text-honey"
          onClick={onExpand}
        >
          See {hidden} more {hidden === 1 ? "reply" : "replies"}
        </button>
      ) : null}
      {visible.map((reply) => (
        <div key={reply.id} data-post-id={reply.id}>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-honey">{reply.handle}</p>
            {showAll ? (
              <p className="text-[11px] text-paper/35">
                {timeAgo(reply.createdAt, now)}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="mt-0.5 block w-full text-left text-sm leading-relaxed text-paper/80"
            onClick={() => setActiveId(activeId === reply.id ? null : reply.id)}
          >
            {reply.body}
          </button>
          {activeId === reply.id ? (
            <div className="mt-1">
              <VoteButtons post={reply} onVote={onVote} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
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
    <span className="inline-flex items-center gap-2 text-[11px] text-paper/40">
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
    <div className="space-y-2.5 px-0.5">
      {posts.map((post) => {
        const href = post.pawToken
          ? `/p/${encodeURIComponent(post.pawToken)}?from=nearby`
          : null;
        const inner = (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-honey">{post.venue}</p>
              <p className="text-[11px] text-paper/40">
                {formatDistance(post.miles)} · {timeAgo(post.createdAt, now)}
              </p>
            </div>
            <p className="mt-0.5 truncate text-sm text-paper/70">
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
  );
}
