import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx, PaginationOpts } from "../lib/types";
import type { PaginationResult } from "convex/server";
import { notFound } from "../lib/errors";
import { userService } from "../users/service";
import { connectedInboxRepository } from "../connectedInboxes/repository";
import { messageRepository } from "./repository";
import { classificationRepository } from "../classifications/repository";

type FeedItem = Doc<"messages"> & {
  classification: Doc<"classifications"> | null;
};

const EMPTY_PAGE: PaginationResult<FeedItem> = {
  page: [],
  isDone: true,
  continueCursor: "",
};

type Urgency = "urgent" | "today" | "later";
const URGENCY_ORDER: Record<Urgency, number> = {
  urgent: 0,
  today: 1,
  later: 2,
};

async function ownedMessage(ctx: QueryCtx, messageId: Id<"messages">) {
  const user = await userService.getCurrentUser(ctx);
  if (!user) return null;

  const message = await messageRepository.byId(ctx, messageId);
  if (!message) return null;

  const inbox = await connectedInboxRepository.byId(ctx, message.inboxId);
  if (!inbox || inbox.userId !== user.userId) return null;
  return message;
}

async function targetInboxIds(
  ctx: QueryCtx,
  inboxId?: Id<"connectedInboxes">,
): Promise<Id<"connectedInboxes">[]> {
  const user = await userService.getCurrentUser(ctx);
  if (!user) return [];

  const inboxes = await connectedInboxRepository.byUserId(ctx, user.userId);
  const ids = new Set(inboxes.map((inbox) => inbox._id));

  if (inboxId === undefined) return Array.from(ids);
  return ids.has(inboxId) ? [inboxId] : [];
}

async function withClassification(
  ctx: QueryCtx,
  message: Doc<"messages">,
): Promise<FeedItem> {
  const classification = await classificationRepository.byMessageIdUnique(
    ctx,
    message._id,
  );
  return { ...message, classification: classification ?? null };
}

export type PriorityFeedArgs = {
  paginationOpts: PaginationOpts;
  inboxId?: Id<"connectedInboxes">;
  urgency?: Urgency;
};

async function getPriorityFeed(ctx: QueryCtx, args: PriorityFeedArgs) {
  const targets = await targetInboxIds(ctx, args.inboxId);
  if (targets.length === 0) return EMPTY_PAGE;

  const messages = await messageRepository.byReceivedAtPaginated(
    ctx,
    args.paginationOpts,
  );

  const now = Date.now();
  const filteredPage = messages.page.filter(
    (msg) =>
      targets.includes(msg.inboxId) &&
      !msg.isHandled &&
      (!msg.snoozedUntil || msg.snoozedUntil < now),
  );

  const feed = await Promise.all(
    filteredPage.map((message) => withClassification(ctx, message)),
  );

  feed.sort((a, b) => {
    const aOrder = URGENCY_ORDER[a.classification?.urgency ?? "later"];
    const bOrder = URGENCY_ORDER[b.classification?.urgency ?? "later"];
    if (aOrder !== bOrder) return aOrder - bOrder;
    return b.receivedAt - a.receivedAt;
  });

  const result = args.urgency
    ? feed.filter((item) => item.classification?.urgency === args.urgency)
    : feed;

  return {
    page: result,
    isDone: messages.isDone,
    continueCursor: messages.continueCursor,
  };
}

async function get(ctx: QueryCtx, messageId: Id<"messages">) {
  const message = await ownedMessage(ctx, messageId);
  if (!message) return null;
  return await withClassification(ctx, message);
}

export type SearchArgs = {
  query: string;
  paginationOpts: PaginationOpts;
};

async function search(ctx: QueryCtx, args: SearchArgs) {
  const targets = await targetInboxIds(ctx);
  if (targets.length === 0) return EMPTY_PAGE;

  const searchLower = args.query.toLowerCase();
  const messages = await messageRepository.byReceivedAtPaginated(
    ctx,
    args.paginationOpts,
  );

  const filtered = messages.page.filter(
    (msg) =>
      targets.includes(msg.inboxId) &&
      (msg.sender.toLowerCase().includes(searchLower) ||
        msg.subject.toLowerCase().includes(searchLower) ||
        msg.senderEmail.toLowerCase().includes(searchLower)),
  );

  const results = await Promise.all(
    filtered.map((message) => withClassification(ctx, message)),
  );

  return {
    page: results,
    isDone: messages.isDone,
    continueCursor: messages.continueCursor,
  };
}

async function markHandled(ctx: MutationCtx, messageId: Id<"messages">) {
  const message = await ownedMessage(ctx, messageId);
  if (!message) throw notFound("Message");

  await messageRepository.patch(ctx, messageId, { isHandled: true });
  return messageId;
}

async function snooze(
  ctx: MutationCtx,
  messageId: Id<"messages">,
  until: number,
) {
  const message = await ownedMessage(ctx, messageId);
  if (!message) throw notFound("Message");

  await messageRepository.patch(ctx, messageId, { snoozedUntil: until });
  return messageId;
}

async function markRead(ctx: MutationCtx, messageId: Id<"messages">) {
  const message = await ownedMessage(ctx, messageId);
  if (!message) throw notFound("Message");

  await messageRepository.patch(ctx, messageId, { isRead: true });
  return messageId;
}

async function getCounts(ctx: QueryCtx, inboxId?: Id<"connectedInboxes">) {
  const zero = { urgent: 0, today: 0, later: 0, total: 0 };
  const targets = await targetInboxIds(ctx, inboxId);
  if (targets.length === 0) return zero;

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const messages = await messageRepository.byReceivedAtGte(
    ctx,
    sevenDaysAgo,
    500,
  );

  const counts = { ...zero };
  for (const message of messages) {
    if (
      !targets.includes(message.inboxId) ||
      message.isHandled ||
      (message.snoozedUntil && message.snoozedUntil > now)
    ) {
      continue;
    }

    const classification = await classificationRepository.byMessageIdUnique(
      ctx,
      message._id,
    );
    const urgency = classification?.urgency ?? "later";
    counts[urgency]++;
    counts.total++;
  }

  return counts;
}

export const messageService = {
  getPriorityFeed,
  get,
  search,
  markHandled,
  snooze,
  markRead,
  getCounts,
};
