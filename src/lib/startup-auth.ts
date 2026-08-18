import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { STARTUP_COOKIE } from "@/lib/auth";
import { getStartup, type StartupRecord } from "@/lib/startups";

export { STARTUP_COOKIE };

export async function requireStartup(): Promise<StartupRecord> {
  const id = (await cookies()).get(STARTUP_COOKIE)?.value;
  const startup = id ? await getStartup(id) : null;
  if (!startup) redirect("/startup");
  return startup;
}
