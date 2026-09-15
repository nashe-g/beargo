import { serviceDayInZone } from "@/lib/dates";
import type { HostRecord } from "@/lib/hosts";
import { hostNightSnapshot, type HostNightSnapshot } from "@/lib/night-tables";

export async function hostTonight(
  host: HostRecord,
): Promise<HostNightSnapshot> {
  return hostNightSnapshot(host.id, serviceDayInZone(host.timezone));
}
