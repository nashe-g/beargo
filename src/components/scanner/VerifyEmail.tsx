"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BearGuide } from "@/components/bear/BearGuide";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { loadLeadSession, saveLeadSession } from "@/lib/lead-session";
import type { PawRecord } from "@/lib/paws";

type Props = {
  paw: PawRecord;
  linkState?: "expired" | "invalid";
};

export function VerifyEmail({ paw, linkState }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("your email");
  const [leadId, setLeadId] = useState("");
  const [mailSent, setMailSent] = useState(true);
  const [mailMode, setMailMode] = useState<"smtp" | "log" | "none">("smtp");
  const [changing, setChanging] = useState(false);
  const [nextEmail, setNextEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"ok" | "err">("ok");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const session = loadLeadSession(paw.token);
    if (session?.email) setEmail(session.email);
    if (session?.leadId) setLeadId(session.leadId);
    if (session?.mailSent === false) setMailSent(false);
  }, [paw.token]);

  useEffect(() => {
    if (!leadId) return;
    let cancelled = false;

    async function tick() {
      try {
        const response = await fetch(`/api/p/${paw.token}/leads/${leadId}`);
        if (!response.ok) return;
        const payload = (await response.json()) as {
          emailVerified?: boolean;
          email?: string;
          mailMode?: "smtp" | "log" | "none";
        };
        if (cancelled) return;
        if (payload.email) setEmail(payload.email);
        if (payload.mailMode) setMailMode(payload.mailMode);
        if (payload.emailVerified) {
          router.replace(`/p/${paw.token}/almost`);
        }
      } catch {
        /* keep waiting */
      }
    }

    tick();
    const id = window.setInterval(tick, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [leadId, paw.token, router]);

  async function resend(address?: string) {
    if (!leadId) {
      setMessageKind("err");
      setMessage("Start the introduction again so we can send a new link.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/p/${paw.token}/leads/${leadId}/resend`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(address ? { email: address } : {}),
        },
      );
      const payload = (await response.json()) as {
        mailSent?: boolean;
        email?: string;
        error?: string;
      };
      if (!response.ok) {
        setMessageKind("err");
        setMessage(payload.error ?? "Could not send the email.");
        setBusy(false);
        return;
      }
      if (payload.email) {
        setEmail(payload.email);
        saveLeadSession(paw.token, { email: payload.email });
      }
      setMailSent(Boolean(payload.mailSent));
      setChanging(false);
      setMessageKind(payload.mailSent ? "ok" : "err");
      setMessage(
        payload.mailSent
          ? "Sent. Check your inbox."
          : "We couldn't send it. Try again in a moment.",
      );
    } catch {
      setMessageKind("err");
      setMessage("Could not send the email.");
    }
    setBusy(false);
  }

  const heading =
    linkState === "expired"
      ? "That link expired"
      : linkState === "invalid"
        ? "That link didn’t work"
        : "One quick check";

  return (
    <ScannerShell progress={{ filledToes: 2 }}>
      <div className="flex flex-1 flex-col justify-between py-4">
        <div className="space-y-6">
          <BearGuide state="idle" size="sm" />
          <h1 className="font-display text-4xl">{heading}</h1>
          {mailSent ? (
            <>
              <p className="text-xl text-paper/80">
                We sent a verification link to{" "}
                <span className="text-honey">{email}</span>.
              </p>
              <p className="text-paper/70">Tap it to keep going.</p>
            </>
          ) : (
            <p className="text-xl text-paper/80">
              We couldn’t send the email to{" "}
              <span className="text-honey">{email}</span>. Try again.
            </p>
          )}
          {mailMode === "log" ? (
            <p className="text-sm text-paper/55">
              On this machine, sent mail is in the{" "}
              <a href="/lab/mail" className="underline">
                lab mailbox
              </a>
              .
            </p>
          ) : null}
          {changing ? (
            <label className="block space-y-2">
              <span className="text-sm tracking-[0.16em] uppercase text-paper/55">
                New email
              </span>
              <input
                type="email"
                value={nextEmail}
                onChange={(event) => setNextEmail(event.target.value)}
                className="h-14 w-full rounded-2xl border border-paper/15 bg-paper/5 px-4 text-lg outline-none"
              />
            </label>
          ) : null}
          {message ? (
            <p className={messageKind === "err" ? "text-clay" : "text-paper/70"}>
              {message}
            </p>
          ) : null}
        </div>
        <div className="space-y-3">
          {changing ? (
            <button
              type="button"
              disabled={busy || !nextEmail.includes("@")}
              onClick={() => resend(nextEmail)}
              className="flex h-14 w-full items-center justify-center rounded-full bg-honey text-lg font-semibold tracking-[0.12em] text-ink disabled:opacity-60"
            >
              SEND TO NEW EMAIL
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => resend()}
              className="flex h-14 w-full items-center justify-center rounded-full border border-paper/20 text-lg"
            >
              RESEND EMAIL
            </button>
          )}
          <button
            type="button"
            onClick={() => setChanging((value) => !value)}
            className="flex h-12 w-full items-center justify-center text-sm text-paper/70"
          >
            {changing ? "Keep this email" : "Use a different email"}
          </button>
        </div>
      </div>
    </ScannerShell>
  );
}
