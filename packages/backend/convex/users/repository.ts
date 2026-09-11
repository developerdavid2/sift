import type { Doc, Id } from "../_generated/dataModel";
import type { DbReader, DbWriter } from "../lib/types";

type UserDoc = Doc<"users">;

export type UserInsert = {
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  plan: "free" | "pro";
  createdAt: number;
  updatedAt: number;
};

export type UserPatch = {
  email?: string;
  name?: string;
  avatarUrl?: string;
  plan?: "free" | "pro";
  planRenewsAt?: number;
  updatedAt: number;
};

export const userRepository = {
  async byExternalId(
    ctx: { db: DbReader },
    externalId: string,
  ): Promise<UserDoc | null> {
    return await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", externalId))
      .unique();
  },

  async byId(ctx: { db: DbReader }, id: Id<"users">): Promise<UserDoc | null> {
    return await ctx.db.get(id);
  },

  async insert(ctx: { db: DbWriter }, input: UserInsert): Promise<Id<"users">> {
    return await ctx.db.insert("users", input);
  },

  async patch(ctx: { db: DbWriter }, id: Id<"users">, updates: UserPatch) {
    await ctx.db.patch(id, updates);
  },

  async delete(ctx: { db: DbWriter }, id: Id<"users">) {
    await ctx.db.delete(id);
  },
};
