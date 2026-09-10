import type { Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../lib/types";
import { notAuthenticated } from "../lib/errors";

import { userRepository } from "./repository";
import type { UserPatch } from "./repository";
import { preferenceRepository } from "../preferences/repository";

type ClerkUserData = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email_addresses?: ReadonlyArray<{ email_address: string }>;
  image_url?: string;
};

export type UserProfileInput = {
  name: string;
  email: string;
  avatarUrl?: string;
};

async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) return null;
  return await userRepository.byExternalId(ctx, identity.subject);
}

async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) throw notAuthenticated();
  return user;
}

async function createUserWithDefaults(
  ctx: MutationCtx,
  input: UserProfileInput & { userId: string },
): Promise<Id<"users">> {
  const now = Date.now();

  const userDocId = await userRepository.insert(ctx, {
    userId: input.userId,
    email: input.email,
    name: input.name,
    avatarUrl: input.avatarUrl,
    plan: "free",
    createdAt: now,
    updatedAt: now,
  });

  await preferenceRepository.insert(ctx, {
    userId: input.userId,
    vipEmails: [],
    mutedCategories: [],
    digestTime: "08:00",
    timezone: "UTC",
    createdAt: now,
    updatedAt: now,
  });

  return userDocId;
}

async function ensureUser(
  ctx: MutationCtx,
  input: UserProfileInput,
): Promise<Id<"users">> {
  const existing = await getCurrentUser(ctx);
  if (existing) return existing._id;

  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw notAuthenticated();

  return await createUserWithDefaults(ctx, {
    userId: identity.subject,
    name: input.name,
    email: input.email,
    avatarUrl: input.avatarUrl,
  });
}

async function updateProfile(
  ctx: MutationCtx,
  input: { name?: string; avatarUrl?: string },
): Promise<Id<"users">> {
  const user = await getCurrentUserOrThrow(ctx);

  const updates: UserPatch = { updatedAt: Date.now() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.avatarUrl !== undefined) updates.avatarUrl = input.avatarUrl;

  await userRepository.patch(ctx, user._id, updates);
  return user._id;
}

async function upsertFromClerk(
  ctx: MutationCtx,
  data: ClerkUserData,
): Promise<void> {
  const name =
    `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || "Anonymous";
  const email = data.email_addresses?.[0]?.email_address ?? "";
  const avatarUrl = data.image_url;

  const user = await userRepository.byExternalId(ctx, data.id);
  if (user === null) {
    await createUserWithDefaults(ctx, {
      userId: data.id,
      name,
      email,
      avatarUrl,
    });
  } else {
    await userRepository.patch(ctx, user._id, {
      name,
      email,
      avatarUrl,
      updatedAt: Date.now(),
    });
  }
}

async function deleteFromClerk(
  ctx: MutationCtx,
  clerkUserId: string,
): Promise<void> {
  const user = await userRepository.byExternalId(ctx, clerkUserId);
  if (user === null) {
    console.warn(
      `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`,
    );
    return;
  }
  await userRepository.delete(ctx, user._id);
}

export const userService = {
  getCurrentUser,
  getCurrentUserOrThrow,
  createUserWithDefaults,
  ensureUser,
  updateProfile,
  upsertFromClerk,
  deleteFromClerk,
};