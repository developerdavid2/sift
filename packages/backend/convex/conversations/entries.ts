import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

import { conversationService } from "./service";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await conversationService.list(ctx, args.paginationOpts);
  },
});

export const get = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await conversationService.get(ctx, args.conversationId);
  },
});

export const create = mutation({
  args: {
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await conversationService.create(ctx, args.title);
  },
});

export const updateTitle = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    return await conversationService.updateTitle(
      ctx,
      args.conversationId,
      args.title,
    );
  },
});

export const remove = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await conversationService.remove(ctx, args.conversationId);
  },
});