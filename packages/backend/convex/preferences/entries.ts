import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

import { preferenceService } from "./service";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await preferenceService.getForCurrentUser(ctx);
  },
});

export const update = mutation({
  args: {
    vipEmails: v.optional(v.array(v.string())),
    mutedCategories: v.optional(v.array(v.string())),
    digestTime: v.optional(v.string()),
    timezone: v.optional(v.string()),
    quietHoursStart: v.optional(v.string()),
    quietHoursEnd: v.optional(v.string()),
    voiceCharacterId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await preferenceService.update(ctx, args);
  },
});

export const addVip = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await preferenceService.addVip(ctx, args.email);
  },
});

export const removeVip = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await preferenceService.removeVip(ctx, args.email);
  },
});

export const addMutedCategory = mutation({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await preferenceService.addMutedCategory(ctx, args.category);
  },
});

export const removeMutedCategory = mutation({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await preferenceService.removeMutedCategory(ctx, args.category);
  },
});