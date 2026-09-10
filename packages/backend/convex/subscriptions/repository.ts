import type { Doc, Id } from "../_generated/dataModel";
import type { DbReader, DbWriter } from "../lib/types";

type SubscriptionDoc = Doc<"subscriptions">;

export type SubscriptionInsert = Omit<SubscriptionDoc, "_id" | "_creationTime">;

export type SubscriptionPatch = {
  plan?: "free" | "pro";
  revenueCatId?: string;
  entitlements?: string[];
  expiresAt?: number;
  updatedAt: number;
};

export const subscriptionRepository = {
  async byUserId(
    ctx: { db: DbReader },
    userId: string,
  ): Promise<SubscriptionDoc | null> {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },

  async byRevenueCatId(
    ctx: { db: DbReader },
    revenueCatId: string,
  ): Promise<SubscriptionDoc | null> {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_revenueCatId", (q) => q.eq("revenueCatId", revenueCatId))
      .unique();
  },

  async insert(
    ctx: { db: DbWriter },
    input: SubscriptionInsert,
  ) {
    return await ctx.db.insert("subscriptions", input);
  },

  async patch(
    ctx: { db: DbWriter },
    id: Id<"subscriptions">,
    updates: SubscriptionPatch,
  ) {
    await ctx.db.patch(id, updates);
  },
};