import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get today's digest for the current user.
 */
export const getToday = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const today = new Date().toISOString().slice(0, 10); // "2026-09-09"

    const digest = await ctx.db
      .query("digests")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", identity.subject).eq("date", today),
      )
      .unique();

    return digest;
  },
});

/**
 * Get a digest by date for the current user.
 */
export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const digest = await ctx.db
      .query("digests")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", identity.subject).eq("date", args.date),
      )
      .unique();

    return digest;
  },
});

/**
 * Get recent digests for the current user (last 7 days).
 */
export const getRecent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const digests = await ctx.db
      .query("digests")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", identity.subject),
      )
      .order("desc")
      .take(7);

    return digests;
  },
});

/**
 * Create or update today's digest.
 * Called by the digest generation action.
 */
export const upsert = mutation({
  args: {
    date: v.string(),
    lines: v.array(
      v.object({
        text: v.string(),
        urgency: v.union(
          v.literal("urgent"),
          v.literal("today"),
          v.literal("later"),
        ),
        messageId: v.id("messages"),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("digests")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", identity.subject).eq("date", args.date),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lines: args.lines,
        audioGenerated: false,
        audioUrl: undefined,
      });
      return existing._id;
    }

    return await ctx.db.insert("digests", {
      userId: identity.subject,
      date: args.date,
      lines: args.lines,
      audioGenerated: false,
      createdAt: Date.now(),
    });
  },
});

/**
 * Mark a digest's audio as generated.
 */
export const markAudioGenerated = mutation({
  args: {
    digestId: v.id("digests"),
    audioUrl: v.string(),
    voiceUsed: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const digest = await ctx.db.get("digests", args.digestId);
    if (!digest) throw new Error("Digest not found");
    if (digest.userId !== identity.subject) throw new Error("Unauthorized");

    await ctx.db.patch(args.digestId, {
      audioGenerated: true,
      audioUrl: args.audioUrl,
      voiceUsed: args.voiceUsed,
    });

    return args.digestId;
  },
});
