import type { Doc } from "@sift/backend/convex/_generated/dataModel";

export type FeedUrgency = "urgent" | "today" | "later";
export type FilterKey = FeedUrgency | "all";

export type PriorityFeedItem = Doc<"messages"> & {
  classification: Doc<"classifications"> | null;
};

export type UrgencyCounts = {
  urgent: number;
  today: number;
  later: number;
  total: number;
};
