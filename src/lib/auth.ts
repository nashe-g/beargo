import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { magicLinks, users } from "@/db/schema";
import { publicOrigin } from "@/lib/config";
import { sendMail } from "@/lib/mail";
import { iso } from "@/lib/money";
import { normalizeEmail } from "@/lib/normalize";
import { hashToken, newSecretToken } from "@/lib/tokens";

export const HOST_COOKIE = "beargo_host";
export const MERCHANT_COOKIE = "beargo_merchant";
export const ADMIN_COOKIE = "beargo_admin";

export type AuthUser = {
  id: string;
  email: string;
  role: "admin" | "host" | "merchant";
  hostId: string | null;
  merchantId: string | null;
};

function mapUser(row: typeof users.$inferSelect): AuthUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role as AuthUser["role"],
    hostId: row.hostId,
    merchantId: row.merchantId,
  };
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export async function getUserByEmail(email: string) {
  const emailNormalized = normalizeEmail(email);
  const [row] = await db()
    .select()
    .from(users)
    .where(eq(users.emailNormalized, emailNormalized))
    .limit(1);
  return row ? mapUser(row) : null;
}

export async function upsertUser(input: {
  email: string;
  role: AuthUser["role"];
  hostId?: string | null;
  merchantId?: string | null;
}) {
  const emailNormalized = normalizeEmail(input.email);
  const existing = await getUserByEmail(input.email);
  if (existing) {
    await db()
      .update(users)
      .set({
        role: input.role,
        hostId: input.hostId ?? existing.hostId,
        merchantId: input.merchantId ?? existing.merchantId,
      })
      .where(eq(users.id, existing.id));
    return (await getUserByEmail(input.email))!;
  }
  const id = randomUUID();
  await db().insert(users).values({
    id,
    email: input.email.trim(),
    emailNormalized,
    role: input.role,
    hostId: input.hostId ?? null,
    merchantId: input.merchantId ?? null,
  });
  return (await getUserByEmail(input.email))!;
}

export async function requestMagicLink(input: {
  email: string;
  origin: string;
  next: string;
}) {
  const user = await getUserByEmail(input.email);
  if (!user) {
    return { ok: true as const, sent: false as const };
  }

  const token = newSecretToken();
  await db().insert(magicLinks).values({
    tokenHash: hashToken(token),
    emailNormalized: normalizeEmail(input.email),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  const url = new URL("/auth/callback", input.origin);
  url.searchParams.set("t", token);
  url.searchParams.set("next", input.next);

  const sent = await sendMail({
    to: user.email,
    subject: "Your BearGo sign-in link",
    text: `Sign in to BearGo:\n${url.toString()}\n\nThis link expires in 30 minutes.`,
    html: `<p>Sign in to BearGo.</p><p><a href="${url.toString()}">Continue</a></p><p>This link expires in 30 minutes.</p>`,
  });

  return { ok: sent.ok, sent: sent.ok, mode: sent.mode };
}

export async function consumeMagicLink(token: string) {
  const hashed = hashToken(token);
  const [row] = await db()
    .select()
    .from(magicLinks)
    .where(and(eq(magicLinks.tokenHash, hashed), isNull(magicLinks.usedAt)))
    .limit(1);
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;

  await db()
    .update(magicLinks)
    .set({ usedAt: new Date() })
    .where(eq(magicLinks.tokenHash, hashed));

  const [user] = await db()
    .select()
    .from(users)
    .where(eq(users.emailNormalized, row.emailNormalized))
    .limit(1);
  return user ? mapUser(user) : null;
}

export async function setAuthCookies(user: AuthUser) {
  const jar = await cookies();
  const options = { path: "/", sameSite: "lax" as const, httpOnly: true };
  if (user.role === "admin") jar.set(ADMIN_COOKIE, "1", options);
  if (user.role === "host" && user.hostId) {
    jar.set(HOST_COOKIE, user.hostId, options);
  }
  if (user.role === "merchant" && user.merchantId) {
    jar.set(MERCHANT_COOKIE, user.merchantId, options);
  }
}

export function safeNext(next: string | null, fallback: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

export function magicLinkOrigin(request: Request) {
  return publicOrigin(request);
}

export { iso };
