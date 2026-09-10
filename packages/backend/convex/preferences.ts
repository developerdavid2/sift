import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the current user's preferences.
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    return preferences;
  },
});

/**
 * Update the current user's preferences.
 */
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!preferences) throw new Error("Preferences not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.vipEmails !== undefined) updates.vipEmails = args.vipEmails;
    if (args.mutedCategories !== undefined)
      updates.mutedCategories = args.mutedCategories;
    if (args.digestTime !== undefined) updates.digestTime = args.digestTime;
    if (args.timezone !== undefined) updates.timezone = args.timezone;
    if (args.quietHoursStart !== undefined)
      updates.quietHoursStart = args.quietHoursStart;
    if (args.quietHoursEnd !== undefined)
      updates.quietHoursEnd = args.quietHoursEnd;
    if (args.voiceCharacterId !== undefined)
      updates.voiceCharacterId = args.voiceCharacterId;

    await ctx.db.patch(preferences._id, updates);
    return preferences._id;
  },
});

/**
 * Add a VIP email to the current user's preferences.
 */
export const addVip = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!preferences) throw new Error("Preferences not found");

    if (preferences.vipEmails.includes(args.email)) {
      throw new Error("Email is already a VIP");
    }

    await ctx.db.patch(preferences._id, {
      vipEmails: [...preferences.vipEmails, args.email],
      updatedAt: Date.now(),
    });

    return preferences._id;
  },
});

/**
 * Remove a VIP email from the current user's preferences.
 */
export const removeVip = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!preferences) throw new Error("Preferences not found");

    await ctx.db.patch(preferences._id, {
      vipEmails: preferences.vipEmails.filter((e) => e !== args.email),
      updatedAt: Date.now(),
    });

    return preferences._id;
  },
});

/**
 * Add a muted category.
 */
export const addMutedCategory = mutation({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!preferences) throw new Error("Preferences not found");

    if (preferences.mutedCategories.includes(args.category)) {
      throw new Error("Category is already muted");
    }

    await ctx.db.patch(preferences._id, {
      mutedCategories: [...preferences.mutedCategories, args.category],
      updatedAt: Date.now(),
    });

    return preferences._id;
  },
});

/**
 * Remove a muted category.
 */
export const removeMutedCategory = mutation({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!preferences) throw new Error("Preferences not found");

    await ctx.db.patch(preferences._id, {
      mutedCategories: preferences.mutedCategories.filter(
        (c) => c !== args.category,
      ),
      updatedAt: Date.now(),
    });

    return preferences._id;
  },
});
