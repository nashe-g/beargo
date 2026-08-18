import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStartup, type StartupRecord } from "@/lib/startups";

export const STARTUP_COOKIE = "beargo_startup";

export async function requireStartup(): Promise<StartupRecord> {
  const id = (await cookies()).get(STARTUP_COOKIE)?.value;
  const startup = id ? getStartup(id) : null;
  if (!startup) redirect("/startup");
  return startup;
}
