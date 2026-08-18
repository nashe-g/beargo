import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE } from "@/lib/auth";

export { ADMIN_COOKIE };

export async function requireAdmin() {
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (value !== "1") redirect("/admin");
}

export async function isAdmin() {
  return (await cookies()).get(ADMIN_COOKIE)?.value === "1";
}
