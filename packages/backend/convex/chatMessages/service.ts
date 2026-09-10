import type { Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx, PaginationOpts } from "../lib/types";
import { notFound } from "../lib/errors";
import { userService } from "../users/service";
import { conversationRepository } from "../conversations/repository";
import { chatMessageRepository } from "./repository";
import type { ChatMessageInsert } from "./repository";

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

async function list(
  ctx: QueryCtx,
  conversationId: Id<"conversations">,
  paginationOpts: PaginationOpts,
) {
  const conversation = await ownedConversation(ctx, conversationId);
  if (!conversation) return EMPTY_PAGE;

  return await chatMessageRepository.byConversationPaginated(
    ctx,
    conversationId,
    paginationOpts,
  );
}

export type CreateChatMessageArgs = {
  conversationId: Id<"conversations">;
  role: "user" | "assistant";
  text: string;
  actionType?: string;
  actionTarget?: string;
};

async function create(ctx: MutationCtx, args: CreateChatMessageArgs) {
  const conversation = await ownedConversation(ctx, args.conversationId);
  if (!conversation) throw notFound("Conversation");

  const insert: ChatMessageInsert = {
    conversationId: args.conversationId,
    role: args.role,
    text: args.text,
    actionType: args.actionType,
    actionTarget: args.actionTarget,
    createdAt: Date.now(),
  };

  const messageId = await chatMessageRepository.insert(ctx, insert);
  await conversationRepository.patch(ctx, args.conversationId, {
    updatedAt: Date.now(),
  });

  return messageId;
}

async function getLast(
  ctx: QueryCtx,
  conversationId: Id<"conversations">,
) {
  const conversation = await ownedConversation(ctx, conversationId);
  if (!conversation) return null;

  return await chatMessageRepository.lastByConversation(ctx, conversationId);
}

export const chatMessageService = {
  list,
  create,
  getLast,
};