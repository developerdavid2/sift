import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the classification for a specific message.
 */
export const getByMessage = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Ensure the message belongs to a connected inbox owned by the user
    const message = await ctx.db.get("messages", args.messageId);
    if (!message) return null;

    const inbox = await ctx.db.get("connectedInboxes", message.inboxId);
    if (!inbox || inbox.userId !== identity.subject) return null;

    const classification = await ctx.db
      .query("classifications")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .unique();

    return classification;
  },
});

/**
 * Save or update a classification for a message.
 * Called by the AI classification action.
 */
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
    // This is an internal function called by actions, not directly by users
    // No auth check needed here since it's called server-side

    const existing = await ctx.db
      .query("classifications")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        urgency: args.urgency,
        urgencyScore: args.urgencyScore,
        category: args.category,
        reason: args.reason,
        modelVersion: args.modelVersion,
      });
      return existing._id;
    }

    return await ctx.db.insert("classifications", {
      messageId: args.messageId,
      urgency: args.urgency,
      urgencyScore: args.urgencyScore,
      category: args.category,
      reason: args.reason,
      modelVersion: args.modelVersion,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get all classifications for a user's messages.
 * Used for analytics and debugging.
 */
export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userInboxes = await ctx.db
      .query("connectedInboxes")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .take(100);

    const inboxIds = new Set(userInboxes.map((inbox) => inbox._id));

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_receivedAt")
      .order("desc")
      .take(100);

    const classifications = [];
    for (const message of messages) {
      if (!inboxIds.has(message.inboxId)) continue;

      const classification = await ctx.db
        .query("classifications")
        .withIndex("by_messageId", (q) => q.eq("messageId", message._id))
        .unique();

      if (classification) {
        classifications.push({
          ...classification,
          message: {
            subject: message.subject,
            sender: message.sender,
          },
        });
      }
    }

    return classifications;
  },
});
