import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

import { userService } from "./service";
import { notAuthenticated, conflict } from "../lib/errors";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await userService.getCurrentUser(ctx);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw notAuthenticated();

    const existing = await userService.getCurrentUser(ctx);
    if (existing) throw conflict("USER_EXISTS", "User record already exists");

    return await userService.createUserWithDefaults(ctx, {
      userId: identity.subject,
      name: args.name,
      email: args.email,
      avatarUrl: args.avatarUrl,
    });
  },
});

export const update = mutation({
  args: {
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await userService.updateProfile(ctx, args);
  },
});

export const ensure = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await userService.ensureUser(ctx, args);
  },
});