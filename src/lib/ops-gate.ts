export const OPS_COOKIE = "beargo_ops";

export function opsPassword() {
  return process.env.OPS_PASSWORD ?? "";
}

export function opsGateEnabled() {
  return process.env.NODE_ENV === "production";
}

export async function opsCookieValue(password: string) {
  const data = new TextEncoder().encode(`beargo-ops:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function isOpsPath(pathname: string) {
  return (
    pathname === "/host" ||
    pathname.startsWith("/host/") ||
    pathname === "/merchant" ||
    pathname.startsWith("/merchant/") ||
    pathname === "/r" ||
    pathname.startsWith("/r/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/lab" ||
    pathname.startsWith("/lab/") ||
    pathname.startsWith("/api/admin/")
  );
}
