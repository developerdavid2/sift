import type { Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx, PaginationOpts } from "../lib/types";
import { notFound } from "../lib/errors";
import { userService } from "../users/service";
import { conversationRepository } from "./repository";
import { chatMessageRepository } from "../chatMessages/repository";

const EMPTY_PAGE = { page: [], isDone: true, continueCursor: "" } as const;

async function ownedConversation(
  ctx: QueryCtx,
  conversationId: Id<"conversations">,
) {
  const user = await userService.getCurrentUser(ctx);
  if (!user) return null;

  const conversation = await conversationRepository.byId(ctx, conversationId);
  if (!conversation || conversation.userId !== user.userId) return null;
  return conversation;
}

async function list(ctx: QueryCtx, paginationOpts: PaginationOpts) {
  const user = await userService.getCurrentUser(ctx);
  if (!user) return EMPTY_PAGE;

  return await conversationRepository.byUserIdPaginated(ctx, user.userId, paginationOpts);
}

async function get(ctx: QueryCtx, conversationId: Id<"conversations">) {
  return await ownedConversation(ctx, conversationId);
}

async function create(ctx: MutationCtx, title: string | undefined) {
  const user = await userService.getCurrentUserOrThrow(ctx);
  const now = Date.now();

  return await conversationRepository.insert(ctx, {
    userId: user.userId,
    title,
    createdAt: now,
    updatedAt: now,
  });
}

async function updateTitle(
  ctx: MutationCtx,
  conversationId: Id<"conversations">,
  title: string,
) {
  const conversation = await ownedConversation(ctx, conversationId);
  if (!conversation) throw notFound("Conversation");

  await conversationRepository.patch(ctx, conversationId, {
    title,
    updatedAt: Date.now(),
  });

  return conversationId;
}

async function remove(ctx: MutationCtx, conversationId: Id<"conversations">) {
  const conversation = await ownedConversation(ctx, conversationId);
  if (!conversation) throw notFound("Conversation");

  await chatMessageRepository.deleteAllByConversation(ctx, conversationId);
  await conversationRepository.delete(ctx, conversationId);

  return conversationId;
}

export const conversationService = {
  list,
  get,
  create,
  updateTitle,
  remove,
};