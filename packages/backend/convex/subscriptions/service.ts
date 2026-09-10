import type { QueryCtx, MutationCtx } from "../lib/types";
import { userService } from "../users/service";
import { userRepository } from "../users/repository";
import { subscriptionRepository } from "./repository";
import type { SubscriptionInsert } from "./repository";

export type SubscriptionUpsertArgs = {
  userId: string;
  plan: "free" | "pro";
  revenueCatId: string;
  entitlements: string[];
  expiresAt?: number;
};

async function get(ctx: QueryCtx) {
  const user = await userService.getCurrentUser(ctx);
  if (!user) return null;

  return await subscriptionRepository.byUserId(ctx, user.userId);
}

async function upsert(ctx: MutationCtx, args: SubscriptionUpsertArgs) {
  const now = Date.now();

  const existing = await subscriptionRepository.byUserId(ctx, args.userId);
  if (existing) {
    await subscriptionRepository.patch(ctx, existing._id, {
      plan: args.plan,
      revenueCatId: args.revenueCatId,
      entitlements: args.entitlements,
      expiresAt: args.expiresAt,
      updatedAt: now,
    });
  } else {
    const insert: SubscriptionInsert = {
      userId: args.userId,
      plan: args.plan,
      revenueCatId: args.revenueCatId,
      entitlements: args.entitlements,
      expiresAt: args.expiresAt,
      createdAt: now,
      updatedAt: now,
    };
    await subscriptionRepository.insert(ctx, insert);
  }

  const user = await userRepository.byExternalId(ctx, args.userId);
  if (user) {
    await userRepository.patch(ctx, user._id, {
      plan: args.plan,
      planRenewsAt: args.expiresAt,
      updatedAt: now,
    });
  }

  return (await subscriptionRepository.byUserId(ctx, args.userId))?._id;
}

async function getByRevenueCatId(ctx: QueryCtx, revenueCatId: string) {
  return await subscriptionRepository.byRevenueCatId(ctx, revenueCatId);
}

export const subscriptionService = {
  get,
  upsert,
  getByRevenueCatId,
};