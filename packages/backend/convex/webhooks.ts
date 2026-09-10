import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

import { userService } from "./users/service";

export const upsertUserFromClerk = internalMutation({
  args: { data: v.any() },
  handler: async (ctx, args) => {
    await userService.upsertFromClerk(ctx, args.data);
  },
});

export const deleteUserFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    await userService.deleteFromClerk(ctx, args.clerkUserId);
  },
});