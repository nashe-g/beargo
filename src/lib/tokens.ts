import { createHash, randomUUID } from "node:crypto";

export function newSecretToken() {
  return randomUUID();
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
