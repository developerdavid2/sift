import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the current user's subscription state.
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    return subscription;
  },
});

/**
 * Create or update subscription state from RevenueCat webhook.
 * This is an internal function called by the webhook handler.
 */
export const upsert = mutation({
  args: {
    userId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro")),
    revenueCatId: v.string(),
    entitlements: v.array(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // This is called by the webhook action, not directly by users
    // Auth is handled at the webhook level

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        plan: args.plan,
        revenueCatId: args.revenueCatId,
        entitlements: args.entitlements,
        expiresAt: args.expiresAt,
        updatedAt: now,
      });

      // Also update the user's plan
      const user = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .unique();

      if (user) {
        await ctx.db.patch(user._id, {
          plan: args.plan,
          planRenewsAt: args.expiresAt,
          updatedAt: now,
        });
      }

      return existing._id;
    }

    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId: args.userId,
      plan: args.plan,
      revenueCatId: args.revenueCatId,
      entitlements: args.entitlements,
      expiresAt: args.expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    // Also update the user's plan
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, {
        plan: args.plan,
        planRenewsAt: args.expiresAt,
        updatedAt: now,
      });
    }

    return subscriptionId;
  },
});

/**
 * Get a subscription by RevenueCat ID.
 */
export const getByRevenueCatId = query({
  args: { revenueCatId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_revenueCatId", (q) =>
        q.eq("revenueCatId", args.revenueCatId),
      )
      .unique();

    return subscription;
  },
});
