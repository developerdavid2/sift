import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

/**
 * List all conversations for the current user.
 */
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .paginate(args.paginationOpts);

    return conversations;
  },
});

/**
 * Get a single conversation by ID.
 */
export const get = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation) return null;
    if (conversation.userId !== identity.subject) return null;

    return conversation;
  },
});

/**
 * Create a new conversation.
 */
export const create = mutation({
  args: {
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      userId: identity.subject,
      title: args.title,
      createdAt: now,
      updatedAt: now,
    });

    return conversationId;
  },
});

/**
 * Update a conversation's title.
 */
export const updateTitle = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (conversation.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.conversationId, {
      title: args.title,
      updatedAt: Date.now(),
    });

    return args.conversationId;
  },
});

/**
 * Delete a conversation and all its messages.
 */
export const remove = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (conversation.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    // Delete all messages in this conversation
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .take(1000);

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    await ctx.db.delete(args.conversationId);
    return args.conversationId;
  },
});
