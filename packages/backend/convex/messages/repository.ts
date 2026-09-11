import type { Doc, Id } from "../_generated/dataModel";
import type { DbReader, DbWriter, PaginationOpts } from "../lib/types";

export type MessagePatch = {
  isRead?: boolean;
  isHandled?: boolean;
  snoozedUntil?: number;
};

export const messageRepository = {
  async byId(
    ctx: { db: DbReader },
    id: Id<"messages">,
  ): Promise<Doc<"messages"> | null> {
    return await ctx.db.get("messages", id);
  },

  async byGmailMessageId(
    ctx: { db: DbReader },
    gmailMessageId: string,
  ): Promise<Doc<"messages"> | null> {
    return await ctx.db
      .query("messages")
      .withIndex("by_gmailMessageId", (q) =>
        q.eq("gmailMessageId", gmailMessageId),
      )
      .unique();
  },

  async byInbox(
    ctx: { db: DbReader },
    inboxId: Id<"connectedInboxes">,
    take = 1000,
  ): Promise<Doc<"messages">[]> {
    return await ctx.db
      .query("messages")
      .withIndex("by_inboxId", (q) => q.eq("inboxId", inboxId))
      .take(take);
  },

  async byReceivedAtPaginated(
    ctx: { db: DbReader },
    paginationOpts: PaginationOpts,
  ) {
    return await ctx.db
      .query("messages")
      .withIndex("by_receivedAt")
      .order("desc")
      .paginate(paginationOpts);
  },

  async byReceivedAtGte(
    ctx: { db: DbReader },
    receivedAt: number,
    take = 500,
  ): Promise<Doc<"messages">[]> {
    return await ctx.db
      .query("messages")
      .withIndex("by_receivedAt", (q) => q.gte("receivedAt", receivedAt))
      .order("desc")
      .take(take);
  },

  async recent(
    ctx: { db: DbReader },
    take = 100,
  ): Promise<Doc<"messages">[]> {
    return await ctx.db
      .query("messages")
      .withIndex("by_receivedAt")
      .order("desc")
      .take(take);
  },

  async patch(
    ctx: { db: DbWriter },
    id: Id<"messages">,
    updates: MessagePatch,
  ) {
    await ctx.db.patch(id, updates);
  },

  async delete(ctx: { db: DbWriter }, id: Id<"messages">) {
    await ctx.db.delete(id);
  },
};