import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { dataFile } from "@/lib/data-dir";
import { APP_NAME } from "@/lib/config";

export type MailMode = "smtp" | "log" | "none";

export type MailLog = {
  id: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  createdAt: string;
};

const MAIL_FILE = dataFile("mail.json");

export function mailMode(): MailMode {
  if (process.env.SMTP_HOST) return "smtp";
  if (process.env.NODE_ENV === "production") return "none";
  return "log";
}

export function mailFrom() {
  return process.env.MAIL_FROM ?? `${APP_NAME} <hello@beargo.pro>`;
}

async function appendLog(entry: MailLog) {
  let rows: MailLog[] = [];
  try {
    rows = JSON.parse(await fs.readFile(MAIL_FILE, "utf8")) as MailLog[];
  } catch {
    rows = [];
  }
  rows.push(entry);
  await fs.mkdir(path.dirname(MAIL_FILE), { recursive: true });
  await fs.writeFile(MAIL_FILE, JSON.stringify(rows, null, 2));
}

export async function listMailLog() {
  if (mailMode() !== "log") return [];
  try {
    return JSON.parse(await fs.readFile(MAIL_FILE, "utf8")) as MailLog[];
  } catch {
    return [];
  }
}

export async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ ok: boolean; mode: MailMode }> {
  const mode = mailMode();
  const entry: MailLog = {
    id: randomUUID(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    createdAt: new Date().toISOString(),
  };

  if (mode === "none") return { ok: false, mode };

  if (mode === "log") {
    await appendLog(entry);
    console.info(`[beargo mail] to=${input.to}\n${input.text}`);
    return { ok: true, mode };
  }

  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  try {
    await transport.sendMail({
      from: mailFrom(),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { ok: true, mode };
  } catch (error) {
    console.error("[beargo mail] send failed", error);
    return { ok: false, mode };
  }
}
