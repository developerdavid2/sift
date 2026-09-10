import type { Doc, Id } from "../_generated/dataModel";
import type { DbReader, DbWriter, PaginationOpts } from "../lib/types";

type ChatMessageDoc = Doc<"chatMessages">;

export type ChatMessageInsert = {
  conversationId: Id<"conversations">;
  role: "user" | "assistant";
  text: string;
  actionType?: string;
  actionTarget?: string;
  createdAt: number;
};

export const chatMessageRepository = {
  async byConversationPaginated(
    ctx: { db: DbReader },
    conversationId: Id<"conversations">,
    paginationOpts: PaginationOpts,
  ) {
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
      .order("asc")
      .paginate(paginationOpts);
  },

  async lastByConversation(
    ctx: { db: DbReader },
    conversationId: Id<"conversations">,
  ): Promise<ChatMessageDoc | null> {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
      .order("desc")
      .take(1);

    return messages[0] ?? null;
  },

  async insert(
    ctx: { db: DbWriter },
    input: ChatMessageInsert,
  ): Promise<Id<"chatMessages">> {
    return await ctx.db.insert("chatMessages", input);
  },

  async deleteAllByConversation(
    ctx: { db: DbWriter },
    conversationId: Id<"conversations">,
  ) {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
      .take(1000);

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
  },
};