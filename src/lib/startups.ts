export type StartupRecord = {
  id: string;
  displayName: string;
  oneLiner: string;
  status?: string;
};

export const DEMO_STARTUP_ID = "jobradar";

export { getStartup, listStartups, upsertStartup } from "@/lib/catalog";
