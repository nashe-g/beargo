export type PiiHit = {
  types: string[];
};

const EMAIL =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

const PHONE =
  /(?:\+?1[\s.-]*)?(?:\(?\d{3}\)?[\s.-]*)\d{3}[\s.-]*\d{4}\b/;

const SSN = /\b\d{3}-\d{2}-\d{4}\b/;

const CARD = /\b(?:\d[ -]*?){13,19}\b/;

const STREET =
  /\b\d{1,5}\s+\w+(?:\s+\w+){0,3}\s+(?:st|street|ave|avenue|rd|road|blvd|boulevard|ln|lane|dr|drive|ct|court|way|hwy|highway)\b/i;

const CONTACT_HANDLE =
  /\b(?:snap(?:chat)?|ig|insta|instagram|whats?app|signal|telegram|kik|tiktok)\s*(?:me|at|is|:)?\s*@?[\w.]{2,32}\b/i;

const BARE_HANDLE_CONTACT =
  /\b(?:my|hit me|add me|text me|dm me)\s+(?:on\s+)?(?:snap(?:chat)?|ig|insta|instagram|whats?app)\b/i;

export function detectFeedPii(raw: string): PiiHit {
  const types: string[] = [];
  if (EMAIL.test(raw)) types.push("email");
  if (PHONE.test(raw)) types.push("phone");
  if (SSN.test(raw)) types.push("government_id");
  if (CARD.test(raw) && raw.replace(/\D/g, "").length >= 13) types.push("financial");
  if (STREET.test(raw)) types.push("address");
  if (CONTACT_HANDLE.test(raw) || BARE_HANDLE_CONTACT.test(raw)) {
    types.push("social_handle");
  }
  return { types };
}
