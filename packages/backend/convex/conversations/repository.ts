import type { Doc, Id } from "../_generated/dataModel";
import type { DbReader, DbWriter, PaginationOpts } from "../lib/types";

type ConversationDoc = Doc<"conversations">;

export type ConversationInsert = {
  userId: string;
  title?: string;
  createdAt: number;
  updatedAt: number;
};

export type ConversationPatch = {
  title?: string;
  updatedAt: number;
};

export const conversationRepository = {
  async byUserIdPaginated(
    ctx: { db: DbReader },
    userId: string,
    paginationOpts: PaginationOpts,
  ) {
    return await ctx.db
      .query("conversations")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(paginationOpts);
  },

  async byId(
    ctx: { db: DbReader },
    id: Id<"conversations">,
  ): Promise<ConversationDoc | null> {
    return await ctx.db.get("conversations", id);
  },

  async insert(
    ctx: { db: DbWriter },
    input: ConversationInsert,
  ): Promise<Id<"conversations">> {
    return await ctx.db.insert("conversations", input);
  },

  async patch(
    ctx: { db: DbWriter },
    id: Id<"conversations">,
    updates: ConversationPatch,
  ) {
    await ctx.db.patch(id, updates);
  },

  async delete(ctx: { db: DbWriter }, id: Id<"conversations">) {
    await ctx.db.delete(id);
  },
};