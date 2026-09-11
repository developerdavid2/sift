import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

import { messageRepository } from "./repository";

import type { Id } from "../_generated/dataModel";

export const insertMessages = internalMutation({
  args: {
    inboxId: v.id("connectedInboxes"),
    messages: v.array(
      v.object({
        gmailMessageId: v.string(),
        threadId: v.optional(v.string()),
        sender: v.string(),
        senderEmail: v.string(),
        subject: v.string(),
        snippet: v.string(),
        body: v.string(),
        receivedAt: v.number(),
        isRead: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args): Promise<{
    created: { index: number; id: Id<"messages"> }[];
    skipped: number;
  }> => {
    const now = Date.now();
    const created: { index: number; id: Id<"messages"> }[] = [];
    let skipped = 0;

    for (let index = 0; index < args.messages.length; index++) {
      const input = args.messages[index];
      if (!input) continue;
      const existing = await messageRepository.byGmailMessageId(
        ctx,
        input.gmailMessageId,
      );
      if (existing) {
        skipped += 1;
        continue;
      }

      const id = await ctx.db.insert("messages", {
        inboxId: args.inboxId,
        gmailMessageId: input.gmailMessageId,
        threadId: input.threadId,
        sender: input.sender,
        senderEmail: input.senderEmail,
        subject: input.subject,
        snippet: input.snippet,
        body: input.body,
        receivedAt: input.receivedAt,
        isRead: input.isRead,
        isHandled: false,
        createdAt: now,
      });
      created.push({ index, id });
    }

    return { created, skipped };
  },
});