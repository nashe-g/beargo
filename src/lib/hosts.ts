export type HostRecord = {
  id: string;
  displayName: string;
  timezone: string;
};

const HOSTS: Record<string, HostRecord> = {
  "the-rustic": {
    id: "the-rustic",
    displayName: "The Rustic",
    timezone: "America/Chicago",
  },
  "the-quiet-room": {
    id: "the-quiet-room",
    displayName: "The Quiet Room",
    timezone: "America/Chicago",
  },
  "rice-union": {
    id: "rice-union",
    displayName: "Rice Union",
    timezone: "America/Chicago",
  },
};

export const DEMO_HOST_ID = "the-rustic";

export function listHosts() {
  return Object.values(HOSTS);
}

export function getHost(hostId: string) {
  return HOSTS[hostId] ?? null;
}

export function getDemoHost() {
  return HOSTS[DEMO_HOST_ID];
}
