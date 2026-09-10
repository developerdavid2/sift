import type { Doc, Id } from "../_generated/dataModel";
import type { DbReader, DbWriter } from "../lib/types";

type PreferenceDoc = Doc<"preferences">;

export type PreferenceInsert = {
  userId: string;
  vipEmails: string[];
  mutedCategories: string[];
  digestTime: string;
  timezone: string;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  voiceCharacterId?: string;
  createdAt: number;
  updatedAt: number;
};

export type PreferencePatch = {
  vipEmails?: string[];
  mutedCategories?: string[];
  digestTime?: string;
  timezone?: string;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  voiceCharacterId?: string;
  updatedAt: number;
};

export const preferenceRepository = {
  async byUserId(
    ctx: { db: DbReader },
    userId: string,
  ): Promise<PreferenceDoc | null> {
    return await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },

  async insert(
    ctx: { db: DbWriter },
    input: PreferenceInsert,
  ): Promise<Id<"preferences">> {
    return await ctx.db.insert("preferences", input);
  },

  async patch(
    ctx: { db: DbWriter },
    id: Id<"preferences">,
    updates: PreferencePatch,
  ) {
    await ctx.db.patch(id, updates);
  },
};