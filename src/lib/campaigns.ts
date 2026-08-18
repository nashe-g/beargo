export type InterestId =
  | "try"
  | "useful"
  | "later"
  | "already"
  | "not-for-me";

export type CampaignStatus = "live" | "paused" | "ended";

export type QualifyOption = {
  id: string;
  label: string;
};

export type QualifyQuestion = {
  id: string;
  prompt: string;
  options: QualifyOption[];
};

export type Campaign = {
  id: string;
  startupId: string;
  name: string;
  status: CampaignStatus;
  headline: string;
  valueProposition: string;
  eligibleHostIds: string[];
  eligibleInterestIds: InterestId[];
  questions: QualifyQuestion[];
  grossCpl: number;
  hostAmount: number;
  platformAmount: number;
  fundedBalance: number;
  maxLeads?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  completionUrl?: string | null;
};

export const INTEREST_OPTIONS: {
  id: InterestId;
  label: string;
  kind: "eligible" | "exit";
}[] = [
  { id: "try", label: "I'd try it", kind: "eligible" },
  { id: "useful", label: "Seems useful", kind: "eligible" },
  { id: "later", label: "Maybe later", kind: "eligible" },
  { id: "already", label: "I already use it", kind: "exit" },
  { id: "not-for-me", label: "Not for me", kind: "exit" },
];

export const DEFAULT_ELIGIBLE_INTEREST: InterestId[] = [
  "try",
  "useful",
  "later",
];

export const SEED_CAMPAIGNS: Campaign[] = [
  {
    id: "jobradar-houston-pilot",
    startupId: "jobradar",
    name: "JobRadar",
    status: "live",
    headline: "TODAY'S SPONSOR",
    valueProposition:
      "JobRadar helps you discover jobs matched to what you're looking for.",
    eligibleHostIds: ["the-rustic"],
    eligibleInterestIds: DEFAULT_ELIGIBLE_INTEREST,
    questions: [
      {
        id: "jobSearch",
        prompt: "Where are you in your job search?",
        options: [
          { id: "active", label: "Actively looking" },
          { id: "open", label: "Open to opportunities" },
          { id: "exploring", label: "Just exploring" },
        ],
      },
      {
        id: "workType",
        prompt: "What kind of work interests you most?",
        options: [
          { id: "full-time", label: "Full-time" },
          { id: "part-time", label: "Part-time" },
          { id: "contract", label: "Contract" },
          { id: "unsure", label: "Not sure yet" },
        ],
      },
    ],
    grossCpl: 10,
    hostAmount: 7,
    platformAmount: 3,
    fundedBalance: 500,
  },
  {
    id: "hoplist-houston-pilot",
    startupId: "hoplist",
    name: "HopList",
    status: "live",
    headline: "TODAY'S SPONSOR",
    valueProposition:
      "HopList finds Houston happy hours, tap lists, and rooms worth going out for.",
    eligibleHostIds: ["the-rustic"],
    eligibleInterestIds: DEFAULT_ELIGIBLE_INTEREST,
    questions: [
      {
        id: "outingFreq",
        prompt: "How often are you out at places like this?",
        options: [
          { id: "weekly", label: "Most weeks" },
          { id: "monthly", label: "A couple times a month" },
          { id: "rarely", label: "Rarely" },
          { id: "visiting", label: "Just visiting" },
        ],
      },
      {
        id: "lookingFor",
        prompt: "What are you usually looking for?",
        options: [
          { id: "new-spots", label: "New spots" },
          { id: "happy-hour", label: "Happy hours" },
          { id: "music", label: "Live music" },
          { id: "hanging", label: "Just hanging out" },
        ],
      },
    ],
    grossCpl: 8,
    hostAmount: 5,
    platformAmount: 3,
    fundedBalance: 400,
  },
  {
    id: "nightowl-paused",
    startupId: "nightowl",
    name: "NightOwl",
    status: "paused",
    headline: "TODAY'S SPONSOR",
    valueProposition: "Late-night plans, without the group chat.",
    eligibleHostIds: ["the-rustic"],
    eligibleInterestIds: DEFAULT_ELIGIBLE_INTEREST,
    questions: [],
    grossCpl: 12,
    hostAmount: 8,
    platformAmount: 4,
    fundedBalance: 300,
  },
  {
    id: "campusbite-rice",
    startupId: "campusbite",
    name: "CampusBite",
    status: "live",
    headline: "TODAY'S SPONSOR",
    valueProposition: "Campus food, without the dining-hall guesswork.",
    eligibleHostIds: ["rice-union"],
    eligibleInterestIds: DEFAULT_ELIGIBLE_INTEREST,
    questions: [
      {
        id: "campus",
        prompt: "Are you on campus around here?",
        options: [
          { id: "student", label: "Student" },
          { id: "alumni", label: "Alumni" },
          { id: "staff", label: "Staff" },
          { id: "visiting", label: "Just visiting" },
        ],
      },
    ],
    grossCpl: 6,
    hostAmount: 4,
    platformAmount: 2,
    fundedBalance: 150,
  },
];

export const CONSENT_VERSION = "intro-v1";

export function interestLabel(id: string) {
  return INTEREST_OPTIONS.find((option) => option.id === id)?.label ?? id;
}

export function qualificationSummary(
  campaign: Campaign | null,
  answers: Record<string, string>,
) {
  if (!campaign) {
    return Object.values(answers).filter(Boolean).join(" · ") || "—";
  }
  return (
    campaign.questions
      .map((question) => {
        const selected = question.options.find(
          (option) => option.id === answers[question.id],
        );
        return selected?.label ?? answers[question.id];
      })
      .filter(Boolean)
      .join(" · ") || "—"
  );
}

export function thanksCopy(reason: string | undefined) {
  if (reason === "already") {
    return "Got it — no need to connect you again. Thanks for playing.";
  }
  if (reason === "not-for-me") {
    return "No problem. Thanks for checking them out.";
  }
  return "No problem. Thanks for playing today's BearGo Challenge.";
}

export function isEligibleInterest(campaign: Campaign, interestId: string) {
  return campaign.eligibleInterestIds.includes(interestId as InterestId);
}

export function answersMatchCampaign(
  campaign: Campaign,
  answers: Record<string, string>,
) {
  return campaign.questions.every((question) =>
    question.options.some((option) => option.id === answers[question.id]),
  );
}
