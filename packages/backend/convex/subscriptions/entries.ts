import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

import { subscriptionService } from "./service";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await subscriptionService.get(ctx);
  },
});

export const upsert = mutation({
  args: {
    userId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro")),
    revenueCatId: v.string(),
    entitlements: v.array(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await subscriptionService.upsert(ctx, args);
  },
});

export const getByRevenueCatId = query({
  args: { revenueCatId: v.string() },
  handler: async (ctx, args) => {
    return await subscriptionService.getByRevenueCatId(ctx, args.revenueCatId);
  },
});