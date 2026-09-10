import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all connected inboxes for the current user.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const inboxes = await ctx.db
      .query("connectedInboxes")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .take(100);

    return inboxes;
  },
});

/**
 * Get a single connected inbox by ID.
 */
export const get = query({
  args: { inboxId: v.id("connectedInboxes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const inbox = await ctx.db.get("connectedInboxes", args.inboxId);
    if (!inbox) return null;

    // Ensure the inbox belongs to the current user
    if (inbox.userId !== identity.subject) return null;

    return inbox;
  },
});

/**
 * Add a new connected inbox after Gmail OAuth.
 * This is called after the OAuth flow completes and tokens are exchanged.
 */
export const add = mutation({
  args: {
    emailAddress: v.string(),
    encryptedTokens: v.string(),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check for duplicate - same email already connected by this user
    const existing = await ctx.db
      .query("connectedInboxes")
      .withIndex("by_emailAddress", (q) =>
        q.eq("emailAddress", args.emailAddress),
      )
      .unique();

    if (existing && existing.userId === identity.subject) {
      throw new Error("This inbox is already connected");
    }

    const now = Date.now();
    const inboxId = await ctx.db.insert("connectedInboxes", {
      userId: identity.subject,
      emailAddress: args.emailAddress,
      label: args.label,
      encryptedTokens: args.encryptedTokens,
      status: "healthy",
      createdAt: now,
      updatedAt: now,
    });

    return inboxId;
  },
});

/**
 * Update a connected inbox's sync state.
 * Called after each sync cycle.
 */
export const updateSyncState = mutation({
  args: {
    inboxId: v.id("connectedInboxes"),
    syncToken: v.optional(v.string()),
    historyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const inbox = await ctx.db.get("connectedInboxes", args.inboxId);
    if (!inbox) throw new Error("Inbox not found");
    if (inbox.userId !== identity.subject) throw new Error("Unauthorized");

    await ctx.db.patch(args.inboxId, {
      syncToken: args.syncToken,
      historyId: args.historyId,
      lastSyncedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.inboxId;
  },
});

/**
 * Update a connected inbox's status.
 */
export const updateStatus = mutation({
  args: {
    inboxId: v.id("connectedInboxes"),
    status: v.union(v.literal("healthy"), v.literal("broken")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const inbox = await ctx.db.get("connectedInboxes", args.inboxId);
    if (!inbox) throw new Error("Inbox not found");
    if (inbox.userId !== identity.subject) throw new Error("Unauthorized");

    await ctx.db.patch(args.inboxId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return args.inboxId;
  },
});

/**
 * Rename a connected inbox's label.
 */
export const rename = mutation({
  args: {
    inboxId: v.id("connectedInboxes"),
    label: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const inbox = await ctx.db.get("connectedInboxes", args.inboxId);
    if (!inbox) throw new Error("Inbox not found");
    if (inbox.userId !== identity.subject) throw new Error("Unauthorized");

    await ctx.db.patch(args.inboxId, {
      label: args.label,
      updatedAt: Date.now(),
    });

    return args.inboxId;
  },
});

/**
 * Remove a connected inbox and all its messages.
 */
export const remove = mutation({
  args: { inboxId: v.id("connectedInboxes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const inbox = await ctx.db.get("connectedInboxes", args.inboxId);
    if (!inbox) throw new Error("Inbox not found");
    if (inbox.userId !== identity.subject) throw new Error("Unauthorized");

    // Delete all messages for this inbox
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_inboxId", (q) => q.eq("inboxId", args.inboxId))
      .take(1000);

    for (const message of messages) {
      // Delete classifications for this message
      const classifications = await ctx.db
        .query("classifications")
        .withIndex("by_messageId", (q) => q.eq("messageId", message._id))
        .take(10);

      for (const classification of classifications) {
        await ctx.db.delete(classification._id);
      }

      // Delete feedback for this message
      const feedbacks = await ctx.db
        .query("feedback")
        .withIndex("by_messageId", (q) => q.eq("messageId", message._id))
        .take(10);

      for (const feedback of feedbacks) {
        await ctx.db.delete(feedback._id);
      }

      await ctx.db.delete(message._id);
    }

    // Delete the inbox
    await ctx.db.delete(args.inboxId);

    return args.inboxId;
  },
});
