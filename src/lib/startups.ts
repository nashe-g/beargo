export type StartupRecord = {
  id: string;
  displayName: string;
  oneLiner: string;
};

const STARTUPS: Record<string, StartupRecord> = {
  jobradar: {
    id: "jobradar",
    displayName: "JobRadar",
    oneLiner: "Jobs matched to what people are looking for.",
  },
  hoplist: {
    id: "hoplist",
    displayName: "HopList",
    oneLiner: "Houston happy hours, tap lists, and rooms worth going out for.",
  },
  campusbite: {
    id: "campusbite",
    displayName: "CampusBite",
    oneLiner: "Campus food, without the dining-hall guesswork.",
  },
  nightowl: {
    id: "nightowl",
    displayName: "NightOwl",
    oneLiner: "Late-night plans, without the group chat.",
  },
};

export const DEMO_STARTUP_ID = "jobradar";

export function getStartup(id: string) {
  return STARTUPS[id] ?? null;
}

export function listStartups() {
  return Object.values(STARTUPS);
}
