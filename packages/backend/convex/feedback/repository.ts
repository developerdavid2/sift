import type { Doc, Id } from "../_generated/dataModel";
import type { DbReader, DbWriter } from "../lib/types";

export const feedbackRepository = {
  async byMessage(
    ctx: { db: DbReader },
    messageId: Id<"messages">,
    take = 10,
  ): Promise<Doc<"feedback">[]> {
    return await ctx.db
      .query("feedback")
      .withIndex("by_messageId", (q) => q.eq("messageId", messageId))
      .take(take);
  },

  async delete(ctx: { db: DbWriter }, id: Id<"feedback">) {
    await ctx.db.delete(id);
  },
};