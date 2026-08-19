import { consumeMagicLink, safeNext, setAuthCookies } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("t");
  const next = safeNext(url.searchParams.get("next"), "/");
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
