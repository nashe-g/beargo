export type PawRecord = {
  token: string;
  hostId: string;
  hostDisplayName: string;
  placementLabel: string;
  timezone: string;
  status: "active" | "inactive";
};

const PAWS: Record<string, PawRecord> = {
  demo: {
    token: "demo",
    hostId: "the-rustic",
    hostDisplayName: "The Rustic",
    placementLabel: "Bar top",
    timezone: "America/Chicago",
    status: "active",
  },
  quiet: {
    token: "quiet",
    hostId: "the-quiet-room",
    hostDisplayName: "The Quiet Room",
    placementLabel: "Front table",
    timezone: "America/Chicago",
    status: "active",
  },
};

export function getPaw(token: string): PawRecord {
  return (
    PAWS[token] ?? {
      token,
      hostId: token,
      hostDisplayName: "this place",
      placementLabel: "Unassigned",
      timezone: "America/Chicago",
      status: "active",
    }
  );
}

export function listPaws() {
  return Object.values(PAWS);
}

export function pawsForHost(hostId: string) {
  return listPaws().filter((paw) => paw.hostId === hostId);
}
