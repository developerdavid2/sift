import { query, mutation, internalMutation } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Validator } from "convex/values";
import type { UserJSON } from "@clerk/backend";

/**
 * Get the current user's record.
 * Returns null if the user hasn't been created yet (e.g. webhook hasn't run).
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await userByExternalId(ctx, identity.subject);
  },
});

/**
 * Create a user record after first sign-up.
 * Called once when the user first interacts with the app.
 */
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if user already exists
    const existing = await userByExternalId(ctx, identity.subject);
    if (existing) {
      throw new Error("User record already exists");
    }

    return await insertUserWithDefaults(ctx, {
      userId: identity.subject,
      name: args.name,
      email: args.email,
      avatarUrl: args.avatarUrl,
    });
  },
});

/**
 * Update the current user's record.
 */
export const update = mutation({
  args: {
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await userByExternalId(ctx, identity.subject);
    if (!user) throw new Error("User not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;

    await ctx.db.patch(user._id, updates);
    return user._id;
  },
});

/**
 * Ensure a user record exists. Creates one if missing.
 * Used by the app on first load after sign-up.
 */
export const ensure = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await userByExternalId(ctx, identity.subject);
    if (existing) return existing._id;

    return await insertUserWithDefaults(ctx, {
      userId: identity.subject,
      name: args.name,
      email: args.email,
      avatarUrl: args.avatarUrl,
    });
  },
});

// ──────────────────────────────────────────────
// Webhook handlers (called from http.ts)
// ──────────────────────────────────────────────

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> },
  async handler(ctx, { data }) {
    const userAttributes = {
      name:
        `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() ||
        "Anonymous",
      email: data.email_addresses?.[0]?.email_address ?? "",
      avatarUrl: data.image_url,
    };

    const user = await userByExternalId(ctx, data.id);
    if (user === null) {
      await insertUserWithDefaults(ctx, {
        userId: data.id,
        name: userAttributes.name,
        email: userAttributes.email,
        avatarUrl: userAttributes.avatarUrl,
      });
    } else {
      await ctx.db.patch(user._id, {
        name: userAttributes.name,
        email: userAttributes.email,
        avatarUrl: userAttributes.avatarUrl,
        updatedAt: Date.now(),
      });
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId);
    if (user !== null) {
      await ctx.db.delete(user._id);
    } else {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`,
      );
    }
  },
});

// ──────────────────────────────────────────────
// Helper functions
// ──────────────────────────────────────────────

type UserInput = {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

/** Insert a user record plus its default preferences row. */
async function insertUserWithDefaults(
  ctx: MutationCtx,
  input: UserInput,
): Promise<import("./_generated/dataModel").Id<"users">> {
  const now = Date.now();
  const userDocId = await ctx.db.insert("users", {
    userId: input.userId,
    email: input.email,
    name: input.name,
    avatarUrl: input.avatarUrl,
    plan: "free",
    createdAt: now,
    updatedAt: now,
  });

  await ctx.db.insert("preferences", {
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

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  return await userByExternalId(ctx, identity.subject);
}

export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const userRecord = await getCurrentUser(ctx);
  if (!userRecord) throw new Error("Can't get current user");
  return userRecord;
}

async function userByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_userId", (q) => q.eq("userId", externalId))
    .unique();
}