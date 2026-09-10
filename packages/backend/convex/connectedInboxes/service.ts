import type { Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../lib/types";
import { notFound, forbidden, conflict } from "../lib/errors";
import { userService } from "../users/service";

import { connectedInboxRepository } from "./repository";
import { messageRepository } from "../messages/repository";
import { classificationRepository } from "../classifications/repository";
import { feedbackRepository } from "../feedback/repository";

async function getOwnedInbox(
  ctx: QueryCtx,
  inboxId: Id<"connectedInboxes">,
) {
  const user = await userService.getCurrentUserOrThrow(ctx);
  const inbox = await connectedInboxRepository.byId(ctx, inboxId);
  if (!inbox) throw notFound("Inbox");
  if (inbox.userId !== user.userId) throw forbidden();
  return inbox;
}

export type AddInboxInput = {
  emailAddress: string;
  encryptedTokens: string;
  label?: string;
};

async function listForCurrentUser(ctx: QueryCtx) {
  const user = await userService.getCurrentUser(ctx);
  if (!user) return [];
  return await connectedInboxRepository.byUserId(ctx, user.userId);
}

async function getOwned(ctx: QueryCtx, inboxId: Id<"connectedInboxes">) {
  const user = await userService.getCurrentUser(ctx);
  if (!user) return null;

  const inbox = await connectedInboxRepository.byId(ctx, inboxId);
  if (!inbox || inbox.userId !== user.userId) return null;
  return inbox;
}

async function add(
  ctx: MutationCtx,
  input: AddInboxInput,
): Promise<Id<"connectedInboxes">> {
  const user = await userService.getCurrentUserOrThrow(ctx);

  const existing = await connectedInboxRepository.byEmailAddress(
    ctx,
    input.emailAddress,
  );
  if (existing && existing.userId === user.userId) {
    throw conflict(
      "INBOX_ALREADY_CONNECTED",
      "This inbox is already connected",
    );
  }

  const now = Date.now();
  return await connectedInboxRepository.insert(ctx, {
    userId: user.userId,
    emailAddress: input.emailAddress,
    label: input.label,
    encryptedTokens: input.encryptedTokens,
    status: "healthy",
    createdAt: now,
    updatedAt: now,
  });
}

export type UpdateSyncStateInput = {
  inboxId: Id<"connectedInboxes">;
  syncToken?: string;
  historyId?: string;
};

async function updateSyncState(
  ctx: MutationCtx,
  input: UpdateSyncStateInput,
): Promise<Id<"connectedInboxes">> {
  await getOwnedInbox(ctx, input.inboxId);

  const updates = { lastSyncedAt: Date.now(), updatedAt: Date.now() };
  await connectedInboxRepository.patch(ctx, input.inboxId, {
    ...updates,
    ...(input.syncToken !== undefined ? { syncToken: input.syncToken } : {}),
    ...(input.historyId !== undefined ? { historyId: input.historyId } : {}),
  });
  return input.inboxId;
}

async function updateStatus(
  ctx: MutationCtx,
  input: { inboxId: Id<"connectedInboxes">; status: "healthy" | "broken" },
): Promise<Id<"connectedInboxes">> {
  await getOwnedInbox(ctx, input.inboxId);
  await connectedInboxRepository.patch(ctx, input.inboxId, {
    status: input.status,
    updatedAt: Date.now(),
  });
  return input.inboxId;
}

async function rename(
  ctx: MutationCtx,
  input: { inboxId: Id<"connectedInboxes">; label: string },
): Promise<Id<"connectedInboxes">> {
  await getOwnedInbox(ctx, input.inboxId);
  await connectedInboxRepository.patch(ctx, input.inboxId, {
    label: input.label,
    updatedAt: Date.now(),
  });
  return input.inboxId;
}

async function remove(
  ctx: MutationCtx,
  inboxId: Id<"connectedInboxes">,
): Promise<Id<"connectedInboxes">> {
  await getOwnedInbox(ctx, inboxId);

  const messages = await messageRepository.byInbox(ctx, inboxId);
  for (const message of messages) {
    for (const classification of await classificationRepository.byMessage(
      ctx,
      message._id,
    )) {
      await classificationRepository.delete(ctx, classification._id);
    }

    for (const feedback of await feedbackRepository.byMessage(ctx, message._id)) {
      await feedbackRepository.delete(ctx, feedback._id);
    }

    await messageRepository.delete(ctx, message._id);
  }

  await connectedInboxRepository.delete(ctx, inboxId);
  return inboxId;
}

export const connectedInboxService = {
  listForCurrentUser,
  getOwned,
  add,
  updateSyncState,
  updateStatus,
  rename,
  remove,
};