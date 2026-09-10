import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

/**
 * Get the priority feed for the current user.
 * Returns messages with their classifications, sorted by urgency and received time.
 * Optionally filtered by a specific inbox.
 */
export const getPriorityFeed = query({
  args: {
    paginationOpts: paginationOptsValidator,
    inboxId: v.optional(v.id("connectedInboxes")),
    urgency: v.optional(
      v.union(v.literal("urgent"), v.literal("today"), v.literal("later")),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    // Get user's connected inboxes
    const userInboxes = await ctx.db
      .query("connectedInboxes")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .take(100);

    const inboxIds = new Set(userInboxes.map((inbox) => inbox._id));

    // Filter to specific inbox if provided
    const targetInboxIds = args.inboxId
      ? inboxIds.has(args.inboxId)
        ? [args.inboxId]
        : []
      : Array.from(inboxIds);

    if (targetInboxIds.length === 0) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    // Query messages for all connected inboxes, sorted by receivedAt descending
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_receivedAt")
      .order("desc")
      .paginate(args.paginationOpts);

    // Filter to target inboxes and not handled
    const filteredPage = messages.page.filter(
      (msg) =>
        targetInboxIds.includes(msg.inboxId) &&
        !msg.isHandled &&
        (!msg.snoozedUntil || msg.snoozedUntil < Date.now()),
    );

    // Fetch classifications for each message
    const feed = await Promise.all(
      filteredPage.map(async (message) => {
        const classification = await ctx.db
          .query("classifications")
          .withIndex("by_messageId", (q) => q.eq("messageId", message._id))
          .unique();

        return {
          ...message,
          classification: classification ?? null,
        };
      }),
    );

    // Sort by urgency priority: urgent > today > later, then by receivedAt
    const urgencyOrder = { urgent: 0, today: 1, later: 2 };
    feed.sort((a, b) => {
      const aUrgency = a.classification?.urgency ?? "later";
      const bUrgency = b.classification?.urgency ?? "later";
      const aOrder = urgencyOrder[aUrgency];
      const bOrder = urgencyOrder[bUrgency];
      if (aOrder !== bOrder) return aOrder - bOrder;
      return b.receivedAt - a.receivedAt;
    });

    // Filter by urgency if provided
    const result = args.urgency
      ? feed.filter((item) => item.classification?.urgency === args.urgency)
      : feed;

    return {
      page: result,
      isDone: messages.isDone,
      continueCursor: messages.continueCursor,
    };
  },
});

/**
 * Get a single message with its classification.
 */
export const get = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const message = await ctx.db.get("messages", args.messageId);
    if (!message) return null;

    // Ensure the message belongs to a connected inbox owned by the user
    const inbox = await ctx.db.get("connectedInboxes", message.inboxId);
    if (!inbox || inbox.userId !== identity.subject) return null;

    const classification = await ctx.db
      .query("classifications")
      .withIndex("by_messageId", (q) => q.eq("messageId", message._id))
      .unique();

    return {
      ...message,
      classification: classification ?? null,
    };
  },
});

/**
 * Search messages by sender, subject, or category.
 */
export const search = query({
  args: {
    query: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const userInboxes = await ctx.db
      .query("connectedInboxes")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .take(100);

    const inboxIds = new Set(userInboxes.map((inbox) => inbox._id));
    const searchLower = args.query.toLowerCase();

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_receivedAt")
      .order("desc")
      .paginate(args.paginationOpts);

    const filtered = messages.page.filter(
      (msg) =>
        inboxIds.has(msg.inboxId) &&
        (msg.sender.toLowerCase().includes(searchLower) ||
          msg.subject.toLowerCase().includes(searchLower) ||
          msg.senderEmail.toLowerCase().includes(searchLower)),
    );

    const results = await Promise.all(
      filtered.map(async (message) => {
        const classification = await ctx.db
          .query("classifications")
          .withIndex("by_messageId", (q) => q.eq("messageId", message._id))
          .unique();

        return {
          ...message,
          classification: classification ?? null,
        };
      }),
    );

    return {
      page: results,
      isDone: messages.isDone,
      continueCursor: messages.continueCursor,
    };
  },
});

/**
 * Mark a message as handled.
 */
export const markHandled = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const message = await ctx.db.get("messages", args.messageId);
    if (!message) throw new Error("Message not found");

    // Ensure the message belongs to a connected inbox owned by the user
    const inbox = await ctx.db.get("connectedInboxes", message.inboxId);
    if (!inbox || inbox.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.messageId, { isHandled: true });
    return args.messageId;
  },
});

/**
 * Snooze a message until a specific time.
 */
export const snooze = mutation({
  args: {
    messageId: v.id("messages"),
    until: v.number(), // timestamp
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const message = await ctx.db.get("messages", args.messageId);
    if (!message) throw new Error("Message not found");

    const inbox = await ctx.db.get("connectedInboxes", message.inboxId);
    if (!inbox || inbox.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.messageId, { snoozedUntil: args.until });
    return args.messageId;
  },
});

/**
 * Mark a message as read.
 */
export const markRead = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const message = await ctx.db.get("messages", args.messageId);
    if (!message) throw new Error("Message not found");

    const inbox = await ctx.db.get("connectedInboxes", message.inboxId);
    if (!inbox || inbox.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.messageId, { isRead: true });
    return args.messageId;
  },
});

/**
 * Get message counts by urgency for the current user.
 * Used for filter chip badges.
 */
export const getCounts = query({
  args: {
    inboxId: v.optional(v.id("connectedInboxes")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { urgent: 0, today: 0, later: 0, total: 0 };
    }

    const userInboxes = await ctx.db
      .query("connectedInboxes")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .take(100);

    const inboxIds = new Set(userInboxes.map((inbox) => inbox._id));
    const targetInboxIds = args.inboxId
      ? inboxIds.has(args.inboxId)
        ? [args.inboxId]
        : []
      : Array.from(inboxIds);

    if (targetInboxIds.length === 0) {
      return { urgent: 0, today: 0, later: 0, total: 0 };
    }

    const now = Date.now();
    const counts = { urgent: 0, today: 0, later: 0, total: 0 };

    // Sample recent messages to get counts (last 7 days)
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_receivedAt", (q) => q.gte("receivedAt", sevenDaysAgo))
      .take(500);

    for (const message of messages) {
      if (
        !targetInboxIds.includes(message.inboxId) ||
        message.isHandled ||
        (message.snoozedUntil && message.snoozedUntil > now)
      ) {
        continue;
      }

      const classification = await ctx.db
        .query("classifications")
        .withIndex("by_messageId", (q) => q.eq("messageId", message._id))
        .unique();

      const urgency = classification?.urgency ?? "later";
      counts[urgency]++;
      counts.total++;
    }

    return counts;
  },
});
