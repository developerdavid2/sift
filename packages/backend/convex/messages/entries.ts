import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

import { messageService } from "./service";

export const getPriorityFeed = query({
  args: {
    paginationOpts: paginationOptsValidator,
    inboxId: v.optional(v.id("connectedInboxes")),
    urgency: v.optional(
      v.union(v.literal("urgent"), v.literal("today"), v.literal("later")),
    ),
  },
  handler: async (ctx, args) => {
    return await messageService.getPriorityFeed(ctx, args);
  },
});

export const get = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    return await messageService.get(ctx, args.messageId);
  },
});

export const search = query({
  args: {
    query: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await messageService.search(ctx, args);
  },
});

export const markHandled = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    return await messageService.markHandled(ctx, args.messageId);
  },
});

export const snooze = mutation({
  args: {
    messageId: v.id("messages"),
    until: v.number(),
  },
  handler: async (ctx, args) => {
    return await messageService.snooze(ctx, args.messageId, args.until);
  },
});

export const markRead = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    return await messageService.markRead(ctx, args.messageId);
  },
});

export const getCounts = query({
  args: {
    inboxId: v.optional(v.id("connectedInboxes")),
  },
  handler: async (ctx, args) => {
    return await messageService.getCounts(ctx, args.inboxId);
  },
});