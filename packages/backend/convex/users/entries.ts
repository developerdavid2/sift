import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

import { userService } from "./service";

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
    return await userService.createUser(ctx, args);
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