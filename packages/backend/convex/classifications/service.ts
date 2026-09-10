import type { Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../lib/types";
import { userService } from "../users/service";
import { connectedInboxRepository } from "../connectedInboxes/repository";
import { messageRepository } from "../messages/repository";
import { classificationRepository } from "./repository";
import type { ClassificationInsert } from "./repository";

export type ClassificationUpsertArgs = {
  messageId: Id<"messages">;
  urgency: "urgent" | "today" | "later";
  urgencyScore: number;
  category: string;
  reason: string;
  modelVersion: string;
};

async function getByMessage(
  ctx: QueryCtx,
  messageId: Id<"messages">,
) {
  const user = await userService.getCurrentUser(ctx);
  if (!user) return null;

  const message = await messageRepository.byId(ctx, messageId);
  if (!message) return null;

  const inbox = await connectedInboxRepository.byId(ctx, message.inboxId);
  if (!inbox || inbox.userId !== user.userId) return null;

  return await classificationRepository.byMessageIdUnique(ctx, messageId);
}

async function upsert(ctx: MutationCtx, args: ClassificationUpsertArgs) {
  const existing = await classificationRepository.byMessageIdUnique(
    ctx,
    args.messageId,
  );

  if (existing) {
    await classificationRepository.patch(ctx, existing._id, {
      urgency: args.urgency,
      urgencyScore: args.urgencyScore,
      category: args.category,
      reason: args.reason,
      modelVersion: args.modelVersion,
    });
    return existing._id;
  }

  const insert: ClassificationInsert = {
    messageId: args.messageId,
    urgency: args.urgency,
    urgencyScore: args.urgencyScore,
    category: args.category,
    reason: args.reason,
    modelVersion: args.modelVersion,
    createdAt: Date.now(),
  };

  return await classificationRepository.insert(ctx, insert);
}

async function listByUser(ctx: QueryCtx) {
  const user = await userService.getCurrentUser(ctx);
  if (!user) return [];

  const inboxes = await connectedInboxRepository.byUserId(ctx, user.userId);
  const inboxIds = new Set(inboxes.map((inbox) => inbox._id));

  const messages = await messageRepository.recent(ctx, 100);

  const classifications = [];
  for (const message of messages) {
    if (!inboxIds.has(message.inboxId)) continue;

    const classification = await classificationRepository.byMessageIdUnique(
      ctx,
      message._id,
    );

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
}

export const classificationService = {
  getByMessage,
  upsert,
  listByUser,
};