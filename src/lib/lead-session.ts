export type LeadSession = {
  campaignId?: string;
  interestId?: string;
  leadId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  verifyToken?: string;
  mailSent?: boolean;
  hostAmount?: number;
};

function storageKey(token: string) {
  return `beargo:lead:${token}`;
}

export function saveLeadSession(token: string, patch: LeadSession) {
  const current = loadLeadSession(token) ?? {};
  sessionStorage.setItem(
    storageKey(token),
    JSON.stringify({ ...current, ...patch }),
  );
}

export function loadLeadSession(token: string): LeadSession | null {
  const raw = sessionStorage.getItem(storageKey(token));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LeadSession;
  } catch {
    return null;
  }
}
