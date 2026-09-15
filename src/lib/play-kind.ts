import { keepFromParam } from "@/lib/play-source";

export function hubPath(token: string, from?: string | null) {
  return `/p/${encodeURIComponent(token)}${keepFromParam(from)}`;
}

export function tableJoinPath(token: string, code: string) {
  return `/p/${encodeURIComponent(token)}/t/${encodeURIComponent(code)}`;
}
