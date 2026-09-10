import type { Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../lib/types";
import { notFound, conflict } from "../lib/errors";
import { userService } from "../users/service";

import { preferenceRepository } from "./repository";
import type { PreferencePatch } from "./repository";

async function byCurrentUser(ctx: QueryCtx) {
  const user = await userService.getCurrentUser(ctx);
  if (!user) return null;
  return await preferenceRepository.byUserId(ctx, user.userId);
}

async function getForCurrentUser(ctx: QueryCtx) {
  return await byCurrentUser(ctx);
}

export type PreferenceUpdateInput = {
  vipEmails?: string[];
  mutedCategories?: string[];
  digestTime?: string;
  timezone?: string;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  voiceCharacterId?: string;
};

async function update(
  ctx: MutationCtx,
  input: PreferenceUpdateInput,
): Promise<Id<"preferences">> {
  const prefs = await byCurrentUser(ctx);
  if (!prefs) throw notFound("Preferences");

  const updates: PreferencePatch = { updatedAt: Date.now() };
  if (input.vipEmails !== undefined) updates.vipEmails = input.vipEmails;
  if (input.mutedCategories !== undefined)
    updates.mutedCategories = input.mutedCategories;
  if (input.digestTime !== undefined) updates.digestTime = input.digestTime;
  if (input.timezone !== undefined) updates.timezone = input.timezone;
  if (input.quietHoursStart !== undefined)
    updates.quietHoursStart = input.quietHoursStart;
  if (input.quietHoursEnd !== undefined)
    updates.quietHoursEnd = input.quietHoursEnd;
  if (input.voiceCharacterId !== undefined)
    updates.voiceCharacterId = input.voiceCharacterId;

  await preferenceRepository.patch(ctx, prefs._id, updates);
  return prefs._id;
}

async function addVip(ctx: MutationCtx, email: string): Promise<Id<"preferences">> {
  const prefs = await byCurrentUser(ctx);
  if (!prefs) throw notFound("Preferences");
  if (prefs.vipEmails.includes(email)) {
    throw conflict("ALREADY_VIP", "Email is already a VIP");
  }

  await preferenceRepository.patch(ctx, prefs._id, {
    vipEmails: [...prefs.vipEmails, email],
    updatedAt: Date.now(),
  });
  return prefs._id;
}

async function removeVip(ctx: MutationCtx, email: string): Promise<Id<"preferences">> {
  const prefs = await byCurrentUser(ctx);
  if (!prefs) throw notFound("Preferences");

  await preferenceRepository.patch(ctx, prefs._id, {
    vipEmails: prefs.vipEmails.filter((e) => e !== email),
    updatedAt: Date.now(),
  });
  return prefs._id;
}

async function addMutedCategory(
  ctx: MutationCtx,
  category: string,
): Promise<Id<"preferences">> {
  const prefs = await byCurrentUser(ctx);
  if (!prefs) throw notFound("Preferences");
  if (prefs.mutedCategories.includes(category)) {
    throw conflict("ALREADY_MUTED", "Category is already muted");
  }

  await preferenceRepository.patch(ctx, prefs._id, {
    mutedCategories: [...prefs.mutedCategories, category],
    updatedAt: Date.now(),
  });
  return prefs._id;
}

async function removeMutedCategory(
  ctx: MutationCtx,
  category: string,
): Promise<Id<"preferences">> {
  const prefs = await byCurrentUser(ctx);
  if (!prefs) throw notFound("Preferences");

  await preferenceRepository.patch(ctx, prefs._id, {
    mutedCategories: prefs.mutedCategories.filter((c) => c !== category),
    updatedAt: Date.now(),
  });
  return prefs._id;
}

export const preferenceService = {
  getForCurrentUser,
  update,
  addVip,
  removeVip,
  addMutedCategory,
  removeMutedCategory,
};