import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { dataFile } from "@/lib/data-dir";
import {
  CAMPAIGNS,
  getCampaign as seedCampaign,
  type Campaign,
  type CampaignStatus,
} from "@/lib/campaigns";

const FILE = dataFile("campaign-overrides.json");

export type CampaignOverride = {
  status?: CampaignStatus;
  eligibleHostIds?: string[];
};

function readOverrides(): Record<string, CampaignOverride> {
  try {
    return JSON.parse(readFileSync(FILE, "utf8")) as Record<
      string,
      CampaignOverride
    >;
  } catch {
    return {};
  }
}

export function applyCampaignOverride(campaign: Campaign): Campaign {
  const patch = readOverrides()[campaign.id];
  if (!patch) return campaign;
  return { ...campaign, ...patch };
}

export function listCampaigns() {
  return CAMPAIGNS.map(applyCampaignOverride);
}

export function getCampaign(id: string) {
  const seed = seedCampaign(id);
  return seed ? applyCampaignOverride(seed) : null;
}

export function campaignsForStartup(startupId: string) {
  return listCampaigns().filter((campaign) => campaign.startupId === startupId);
}

export function patchCampaign(id: string, patch: CampaignOverride) {
  const seed = seedCampaign(id);
  if (!seed) return null;
  const all = readOverrides();
  all[id] = { ...all[id], ...patch };
  mkdirSync(path.dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(all, null, 2));
  return applyCampaignOverride(seed);
}
