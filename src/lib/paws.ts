export type PawRecord = {
  token: string;
  hostId: string;
  hostDisplayName: string;
  placementLabel: string;
  timezone: string;
  status: "active" | "inactive";
};

export { getPaw, listPaws, pawsForHost, upsertPaw, unassignedPaw } from "@/lib/catalog";
