import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

import { classificationService } from "./service";

export const getByMessage = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    return await classificationService.getByMessage(ctx, args.messageId);
  },
});

export const upsert = mutation({
  args: {
    messageId: v.id("messages"),
    urgency: v.union(
      v.literal("urgent"),
      v.literal("today"),
      v.literal("later"),
    ),
    urgencyScore: v.number(),
    category: v.string(),
    reason: v.string(),
    modelVersion: v.string(),
  },
  handler: async (ctx, args) => {
    return await classificationService.upsert(ctx, args);
  },
});

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    return await classificationService.listByUser(ctx);
  },
});