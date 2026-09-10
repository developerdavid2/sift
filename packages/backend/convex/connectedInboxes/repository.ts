import type { Doc, Id } from "../_generated/dataModel";
import type { DbReader, DbWriter } from "../lib/types";

type InboxDoc = Doc<"connectedInboxes">;

export type InboxInsert = {
  userId: string;
  emailAddress: string;
  label?: string;
  encryptedTokens: string;
  status: "healthy" | "broken";
  createdAt: number;
  updatedAt: number;
};

export type InboxPatch = {
  label?: string;
  syncToken?: string;
  historyId?: string;
  lastSyncedAt?: number;
  status?: "healthy" | "broken";
  updatedAt: number;
};

export const connectedInboxRepository = {
  async byUserId(
    ctx: { db: DbReader },
    userId: string,
    take = 100,
  ): Promise<InboxDoc[]> {
    return await ctx.db
      .query("connectedInboxes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(take);
  },

  async byEmailAddress(
    ctx: { db: DbReader },
    emailAddress: string,
  ): Promise<InboxDoc | null> {
    return await ctx.db
      .query("connectedInboxes")
      .withIndex("by_emailAddress", (q) => q.eq("emailAddress", emailAddress))
      .unique();
  },

  async byId(
    ctx: { db: DbReader },
    id: Id<"connectedInboxes">,
  ): Promise<InboxDoc | null> {
    return await ctx.db.get("connectedInboxes", id);
  },

  async insert(
    ctx: { db: DbWriter },
    input: InboxInsert,
  ): Promise<Id<"connectedInboxes">> {
    return await ctx.db.insert("connectedInboxes", input);
  },

  async patch(
    ctx: { db: DbWriter },
    id: Id<"connectedInboxes">,
    updates: InboxPatch,
  ) {
    await ctx.db.patch(id, updates);
  },

  async delete(ctx: { db: DbWriter }, id: Id<"connectedInboxes">) {
    await ctx.db.delete(id);
  },
};