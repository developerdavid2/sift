import { internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

import { connectedInboxRepository } from "../connectedInboxes/repository";
import { messageRepository } from "../messages/repository";
import { classificationRepository } from "../classifications/repository";
import { feedbackRepository } from "../feedback/repository";

import type { MutationCtx } from "../lib/types";
import type { Id } from "../_generated/dataModel";

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

export const getConnectedInboxById = internalQuery({
  args: { inboxId: v.id("connectedInboxes") },
  handler: async (ctx, args) => {
    return (await connectedInboxRepository.byId(ctx, args.inboxId)) ?? null;
  },
});

export const getConnectedInboxByUserAndEmail = internalQuery({
  args: { userId: v.string(), emailAddress: v.string() },
  handler: async (ctx, args) => {
    return (
      (await connectedInboxRepository.byUserIdAndEmailAddress(
        ctx,
        args.userId,
        args.emailAddress,
      )) ?? null
    );
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

    const existing = await connectedInboxRepository.byUserIdAndEmailAddress(
      ctx,
      args.userId,
      args.emailAddress,
    );
    if (existing) {
      return {
        status: "already-connected" as const,
        emailAddress: args.emailAddress,
        inboxId: existing._id,
      };
    }

    const now = Date.now();
    const inboxId = await connectedInboxRepository.insert(ctx, {
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
      inboxId,
    };
  },
});

export const listConnectedInboxesByUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await connectedInboxRepository.byUserId(ctx, args.userId);
  },
});

export const updateInboxSyncState = internalMutation({
  args: {
    inboxId: v.id("connectedInboxes"),
    syncToken: v.optional(v.union(v.string(), v.null())),
    historyId: v.optional(v.union(v.string(), v.null())),
    lastSyncedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {};
    if (args.syncToken !== undefined) {
      updates.syncToken = args.syncToken ?? undefined;
    }
    if (args.historyId !== undefined) {
      updates.historyId = args.historyId ?? undefined;
    }
    if (args.lastSyncedAt !== undefined) {
      updates.lastSyncedAt = args.lastSyncedAt;
    }
    updates.updatedAt = Date.now();
    await ctx.db.patch("connectedInboxes", args.inboxId, updates);
  },
});

const DISCONNECT_BATCH_SIZE = 100;

export const disconnectInbox = internalMutation({
  args: {
    userId: v.string(),
    inboxId: v.optional(v.id("connectedInboxes")),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? DISCONNECT_BATCH_SIZE;
    const inboxes = await connectedInboxRepository.byUserId(ctx, args.userId);
    let removed = 0;

    for (const inbox of inboxes) {
      if (args.inboxId && inbox._id !== args.inboxId) continue;

      const messages = await messageRepository.byInbox(
        ctx,
        inbox._id,
        batchSize + 1,
      );
      if (messages.length > batchSize) {
        for (const message of messages.slice(0, batchSize)) {
          await deleteMessage(ctx, message._id);
        }
        await ctx.scheduler.runAfter(
          0,
          internal.gmail.internal.disconnectInbox,
          { userId: args.userId, inboxId: args.inboxId, batchSize },
        );
        return removed;
      }

      for (const message of messages) {
        await deleteMessage(ctx, message._id);
      }

      await connectedInboxRepository.delete(ctx, inbox._id);
      removed += 1;
    }

    return removed;
  },
});

async function deleteMessage(ctx: MutationCtx, messageId: Id<"messages">) {
  for (const classification of await classificationRepository.byMessage(
    ctx,
    messageId,
  )) {
    await classificationRepository.delete(ctx, classification._id);
  }

  for (const feedback of await feedbackRepository.byMessage(ctx, messageId)) {
    await feedbackRepository.delete(ctx, feedback._id);
  }

  await messageRepository.delete(ctx, messageId);
}