import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HOST_COOKIE, isProduction } from "@/lib/auth";
import { DEMO_HOST_ID, getHost, type HostRecord } from "@/lib/hosts";

export { HOST_COOKIE };

export async function requireHost(): Promise<HostRecord> {
  const id = (await cookies()).get(HOST_COOKIE)?.value ?? (isProduction() ? "" : DEMO_HOST_ID);
  const host = id ? await getHost(id) : null;
  if (!host) redirect("/host");
  return host;
}
