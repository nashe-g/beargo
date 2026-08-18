import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "beargo_admin";

export async function requireAdmin() {
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (value !== "1") redirect("/admin");
}

export async function isAdmin() {
  return (await cookies()).get(ADMIN_COOKIE)?.value === "1";
}
