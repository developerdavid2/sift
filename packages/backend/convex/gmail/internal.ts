import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

import { connectedInboxRepository } from "../connectedInboxes/repository";
import { messageRepository } from "../messages/repository";
import { classificationRepository } from "../classifications/repository";
import { feedbackRepository } from "../feedback/repository";

export const getOauthState = internalQuery({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("gmailOauthStates")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .unique();
    return row ?? null;
  },
});

export const upsertOauthState = internalMutation({
  args: {
    state: v.string(),
    userId: v.string(),
    returnUrl: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("gmailOauthStates", args);
  },
});

export const deleteOauthState = internalMutation({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("gmailOauthStates")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .unique();
    if (row) await ctx.db.delete("gmailOauthStates", row._id);
  },
});

export const getConnectedInboxByEmail = internalQuery({
  args: { emailAddress: v.string() },
  handler: async (ctx, args) => {
    return (await connectedInboxRepository.byEmailAddress(ctx, args.emailAddress)) ?? null;
  },
});

export const saveConnectedInbox = internalMutation({
  args: {
    userId: v.string(),
    emailAddress: v.string(),
    encryptedTokens: v.string(),
    state: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const state = args.state;
    if (state) {
      const stateRow = await ctx.db
        .query("gmailOauthStates")
        .withIndex("by_state", (q) => q.eq("state", state))
        .unique();
      if (stateRow) await ctx.db.delete("gmailOauthStates", stateRow._id);
    }

    const existing = await connectedInboxRepository.byEmailAddress(
      ctx,
      args.emailAddress,
    );
    if (existing) {
      return {
        status: "already-connected" as const,
        emailAddress: args.emailAddress,
      };
    }

    const now = Date.now();
    await connectedInboxRepository.insert(ctx, {
      userId: args.userId,
      emailAddress: args.emailAddress,
      encryptedTokens: args.encryptedTokens,
      status: "healthy",
      createdAt: now,
      updatedAt: now,
    });

    return {
      status: "connected" as const,
      emailAddress: args.emailAddress,
    };
  },
});

export const listConnectedInboxesByUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await connectedInboxRepository.byUserId(ctx, args.userId);
  },
});

export const disconnectInbox = internalMutation({
  args: {
    userId: v.string(),
    inboxId: v.optional(v.id("connectedInboxes")),
  },
  handler: async (ctx, args) => {
    const inboxes = await connectedInboxRepository.byUserId(ctx, args.userId);
    let removed = 0;

    for (const inbox of inboxes) {
      if (args.inboxId && inbox._id !== args.inboxId) continue;

      const messages = await messageRepository.byInbox(ctx, inbox._id);
      for (const message of messages) {
        for (const classification of await classificationRepository.byMessage(
          ctx,
          message._id,
        )) {
          await classificationRepository.delete(ctx, classification._id);
        }

        for (const feedback of await feedbackRepository.byMessage(
          ctx,
          message._id,
        )) {
          await feedbackRepository.delete(ctx, feedback._id);
        }

        await messageRepository.delete(ctx, message._id);
      }

      await connectedInboxRepository.delete(ctx, inbox._id);
      removed += 1;
    }

    return removed;
  },
});