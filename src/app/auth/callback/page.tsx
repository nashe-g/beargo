import { consumeMagicLink, safeNext, setAuthCookies } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const token = Array.isArray(query.t) ? query.t[0] : query.t;
  const next = safeNext(
    Array.isArray(query.next) ? query.next[0] : query.next ?? null,
    "/",
  );
  const user = token ? await consumeMagicLink(token) : null;
  if (!user) redirect("/auth/expired");
  await setAuthCookies(user);
  const destination =
    next !== "/"
      ? next
      : user.role === "admin"
        ? "/admin/overview"
        : user.role === "host"
        ? "/host/dashboard"
        : "/merchant/dashboard";
  redirect(destination);
}
