import type { Doc, Id } from "../_generated/dataModel";
import type { DbReader, DbWriter } from "../lib/types";

type DigestDoc = Doc<"digests">;

export type DigestInsert = Omit<DigestDoc, "_id" | "_creationTime">;

export const digestRepository = {
  async byUserIdAndDate(
    ctx: { db: DbReader },
    userId: string,
    date: string,
  ): Promise<DigestDoc | null> {
    return await ctx.db
      .query("digests")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", userId).eq("date", date),
      )
      .unique();
  },

  async recentByUserId(
    ctx: { db: DbReader },
    userId: string,
    take = 7,
  ): Promise<DigestDoc[]> {
    return await ctx.db
      .query("digests")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(take);
  },

  async byId(ctx: { db: DbReader }, id: Id<"digests">): Promise<DigestDoc | null> {
    return await ctx.db.get("digests", id);
  },

  async insert(
    ctx: { db: DbWriter },
    input: DigestInsert,
  ): Promise<Id<"digests">> {
    return await ctx.db.insert("digests", input);
  },

  async patch(
    ctx: { db: DbWriter },
    id: Id<"digests">,
    updates: Partial<DigestInsert>,
  ) {
    await ctx.db.patch(id, updates);
  },
};