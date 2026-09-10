import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

import { connectedInboxService } from "./service";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await connectedInboxService.listForCurrentUser(ctx);
  },
});

export const get = query({
  args: { inboxId: v.id("connectedInboxes") },
  handler: async (ctx, args) => {
    return await connectedInboxService.getOwned(ctx, args.inboxId);
  },
});

export const add = mutation({
  args: {
    emailAddress: v.string(),
    encryptedTokens: v.string(),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await connectedInboxService.add(ctx, args);
  },
});

export const updateSyncState = mutation({
  args: {
    inboxId: v.id("connectedInboxes"),
    syncToken: v.optional(v.string()),
    historyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await connectedInboxService.updateSyncState(ctx, args);
  },
});

export const updateStatus = mutation({
  args: {
    inboxId: v.id("connectedInboxes"),
    status: v.union(v.literal("healthy"), v.literal("broken")),
  },
  handler: async (ctx, args) => {
    return await connectedInboxService.updateStatus(ctx, args);
  },
});

export const rename = mutation({
  args: {
    inboxId: v.id("connectedInboxes"),
    label: v.string(),
  },
  handler: async (ctx, args) => {
    return await connectedInboxService.rename(ctx, args);
  },
});

export const remove = mutation({
  args: { inboxId: v.id("connectedInboxes") },
  handler: async (ctx, args) => {
    return await connectedInboxService.remove(ctx, args.inboxId);
  },
});