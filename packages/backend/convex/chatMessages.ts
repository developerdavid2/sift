import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

/**
 * List messages in a conversation.
 */
export const list = query({
  args: {
    conversationId: v.id("conversations"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    // Ensure the conversation belongs to the current user
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.userId !== identity.subject) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .paginate(args.paginationOpts);

    return messages;
  },
});

/**
 * Add a message to a conversation.
 */
export const create = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    text: v.string(),
    actionType: v.optional(v.string()),
    actionTarget: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Ensure the conversation belongs to the current user
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (conversation.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("chatMessages", {
      conversationId: args.conversationId,
      role: args.role,
      text: args.text,
      actionType: args.actionType,
      actionTarget: args.actionTarget,
      createdAt: now,
    });

    // Update conversation's updatedAt
    await ctx.db.patch(args.conversationId, { updatedAt: now });

    return messageId;
  },
});

/**
 * Get the last message in a conversation.
 */
export const getLast = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.userId !== identity.subject) return null;

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("desc")
      .take(1);

    return messages[0] ?? null;
  },
});
