import { BEARGO_DAY_ZONE } from "@/lib/config";
import { localDateInZone } from "@/lib/dates";
import { getPublishedSlate } from "@/lib/question-slate-store";
import type { Question } from "@/lib/questions";

export type DailyChallenge = {
  id: string;
  localDate: string;
  questions: Question[];
};

export function networkSlateDate(at = new Date()) {
  return localDateInZone(BEARGO_DAY_ZONE, at);
}

export async function getTonightSlate(
  hostId: string,
  _timezone: string,
  at = new Date(),
): Promise<DailyChallenge> {
  const localDate = networkSlateDate(at);
  const questions = (await getPublishedSlate(localDate)) ?? [];
  return {
    id: `${hostId}:${localDate}`,
    localDate,
    questions,
  };
}
