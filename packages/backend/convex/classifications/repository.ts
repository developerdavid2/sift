import type { Doc, Id } from "../_generated/dataModel";
import type { DbReader, DbWriter } from "../lib/types";

type ClassificationDoc = Doc<"classifications">;

export type ClassificationInsert = {
  messageId: Id<"messages">;
  urgency: "urgent" | "today" | "later";
  urgencyScore: number;
  category: string;
  reason: string;
  modelVersion: string;
  createdAt: number;
};

export type ClassificationPatch = {
  urgency?: "urgent" | "today" | "later";
  urgencyScore?: number;
  category?: string;
  reason?: string;
  modelVersion?: string;
};

export const classificationRepository = {
  async byMessage(
    ctx: { db: DbReader },
    messageId: Id<"messages">,
    take = 10,
  ): Promise<ClassificationDoc[]> {
    return await ctx.db
      .query("classifications")
      .withIndex("by_messageId", (q) => q.eq("messageId", messageId))
      .take(take);
  },

  async byMessageIdUnique(
    ctx: { db: DbReader },
    messageId: Id<"messages">,
  ): Promise<ClassificationDoc | null> {
    return await ctx.db
      .query("classifications")
      .withIndex("by_messageId", (q) => q.eq("messageId", messageId))
      .unique();
  },

  async insert(
    ctx: { db: DbWriter },
    input: ClassificationInsert,
  ): Promise<Id<"classifications">> {
    return await ctx.db.insert("classifications", input);
  },

  async patch(
    ctx: { db: DbWriter },
    id: Id<"classifications">,
    updates: ClassificationPatch,
  ) {
    await ctx.db.patch(id, updates);
  },

  async delete(ctx: { db: DbWriter }, id: Id<"classifications">) {
    await ctx.db.delete(id);
  },
};