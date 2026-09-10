import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

import { chatMessageService } from "./service";

export const list = query({
  args: {
    conversationId: v.id("conversations"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await chatMessageService.list(ctx, args.conversationId, args.paginationOpts);
  },
});

export const create = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    text: v.string(),
    actionType: v.optional(v.string()),
    actionTarget: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await chatMessageService.create(ctx, args);
  },
});

export const getLast = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await chatMessageService.getLast(ctx, args.conversationId);
  },
});