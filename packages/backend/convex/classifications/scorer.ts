// Deterministic v1 scorer. Each rule list is checked in order against the
// normalized (lowercased) sender + subject + snippet + body text. The first
// category that matches wins. Swap this module for an LLM call later — the
// interface is the classification contract, and modelVersion tracks the
// scoring approach that produced each result.

const MODEL_VERSION = "heuristic-v1";

export type ClassifyInput = {
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  body: string;
  receivedAt: number;
};

export type ClassificationOutput = {
  urgency: "urgent" | "today" | "later";
  urgencyScore: number;
  category: string;
  reason: string;
  modelVersion: string;
};

type Rule = {
  category: string;
  urgency: "urgent" | "today" | "later";
  score: number;
  patterns: string[];
  reason: string;
};

const RULES: Rule[] = [
  {
    category: "job_offer",
    urgency: "urgent",
    score: 10,
    patterns: [
      "job offer",
      "offer letter",
      "employment offer",
      "you're hired",
      "you are hired",
      "welcome to the team",
      "offer to join",
      "hiring decision",
      "your offer",
      "offer of employment",
      "accept the offer",
    ],
    reason: "Looks like a job offer or hire decision.",
  },
  {
    category: "interview",
    urgency: "urgent",
    score: 10,
    patterns: [
      "interview",
      "interview invitation",
      "phone screen",
      "technical screen",
      "online assessment",
      "take-home",
      "coding challenge",
      "onsite",
      "recruiter",
      "hiring manager",
    ],
    reason: "Interview-related — check the details.",
  },
  {
    category: "deadline",
    urgency: "urgent",
    score: 10,
    patterns: [
      "deadline",
      "due today",
      "due tomorrow",
      "due by",
      "final notice",
      "action required",
      "overdue",
      "expires today",
      "expiring",
      "last day",
      "last chance",
      "closes tonight",
      "payment due",
      "response required",
    ],
    reason: "Something has a deadline.",
  },
  {
    category: "invoice",
    urgency: "today",
    score: 7,
    patterns: [
      "invoice",
      "payment received",
      "payment confirmation",
      "receipt",
      "billing",
      "statement",
      "refund",
      "autopay",
      "you paid",
    ],
    reason: "Payment or invoice related.",
  },
  {
    category: "meeting",
    urgency: "today",
    score: 7,
    patterns: [
      "meeting",
      "calendar invite",
      "invitation accepted",
      "reschedule",
      "agenda",
      "kickoff",
      "standup",
      "conference call",
      "zoom",
      "google meet",
      "teams meeting",
    ],
    reason: "Looks like a meeting or calendar event.",
  },
  {
    category: "reply_needed",
    urgency: "today",
    score: 7,
    patterns: [
      "need your input",
      "can you review",
      "please confirm",
      "your thoughts",
      "question for you",
      "quick question",
      "what do you think",
      "circling back",
      "following up",
      "follow-up",
      "reply",
      "respond",
      "asap",
      "pending your",
    ],
    reason: "Might need a reply.",
  },
  {
    category: "newsletter",
    urgency: "later",
    score: 3,
    patterns: [
      "unsubscribe",
      "newsletter",
      "weekly digest",
      "daily digest",
      "view in browser",
      "sales limited time",
      "new arrivals",
      "shop now",
      "limited time",
      "save up to",
      "promo",
      "free shipping",
      "members only",
    ],
    reason: "Looks like a newsletter or promo.",
  },
  {
    category: "notification",
    urgency: "later",
    score: 3,
    patterns: [
      "do not reply",
      "donotreply",
      "no-reply",
      "noreply",
      "verification code",
      "one-time code",
      "sign-in link",
      "reset your password",
      "security alert",
      "password reset",
      "account activity",
      "confirm your email",
    ],
    reason: "Likely an automated notification.",
  },
];

export function classifyMessage(input: ClassifyInput): ClassificationOutput {
  const haystack = `${input.senderEmail} ${input.sender} ${input.subject} ${input.snippet} ${input.body}`
    .toLowerCase();

  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => haystack.includes(pattern))) {
      return {
        urgency: rule.urgency,
        urgencyScore: rule.score,
        category: rule.category,
        reason: rule.reason,
        modelVersion: MODEL_VERSION,
      };
    }
  }

  return {
    urgency: "later",
    urgencyScore: 3,
    category: "other",
    reason: `From ${input.sender || input.senderEmail || "an unknown sender"}.`,
    modelVersion: MODEL_VERSION,
  };
}