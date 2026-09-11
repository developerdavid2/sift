import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

import { classificationRepository } from "./repository";

import type { ClassificationInsert } from "./repository";

export const insertClassifications = internalMutation({
  args: {
    classifications: v.array(
      v.object({
        messageId: v.id("messages"),
        urgency: v.union(
          v.literal("urgent"),
          v.literal("today"),
          v.literal("later"),
        ),
        urgencyScore: v.number(),
        category: v.string(),
        reason: v.string(),
        modelVersion: v.string(),
      }),
    ),
  },
  handler: async (ctx, args): Promise<{ inserted: number }> => {
    const now = Date.now();
    let inserted = 0;

    for (const classification of args.classifications) {
      const existing = await classificationRepository.byMessageIdUnique(
        ctx,
        classification.messageId,
      );
      if (existing) continue;

      const insert: ClassificationInsert = {
        messageId: classification.messageId,
        urgency: classification.urgency,
        urgencyScore: classification.urgencyScore,
        category: classification.category,
        reason: classification.reason,
        modelVersion: classification.modelVersion,
        createdAt: now,
      };
      await classificationRepository.insert(ctx, insert);
      inserted += 1;
    }

    return { inserted };
  },
});