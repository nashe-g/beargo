export type HostRecord = {
  id: string;
  displayName: string;
  timezone: string;
  city?: string;
  neighborhood?: string | null;
  address?: string | null;
  type?: string;
  status?: string;
  lat?: number | null;
  lng?: number | null;
  excludedCategories: string[];
  excludedMerchantIds: string[];
};

export const DEMO_HOST_ID = "the-rustic";

export { getHost, listHosts, upsertHost } from "@/lib/catalog";

import { getHost } from "@/lib/catalog";

export async function getDemoHost() {
  const host = await getHost(DEMO_HOST_ID);
  if (!host) {
    throw new Error("Demo host is not seeded");
  }
  return host;
}
