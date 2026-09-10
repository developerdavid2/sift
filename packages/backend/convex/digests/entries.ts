import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

import { digestService } from "./service";

export const getToday = query({
  args: {},
  handler: async (ctx) => {
    return await digestService.getToday(ctx);
  },
});

export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await digestService.getByDate(ctx, args.date);
  },
});

export const getRecent = query({
  args: {},
  handler: async (ctx) => {
    return await digestService.getRecent(ctx);
  },
});

export const upsert = mutation({
  args: {
    date: v.string(),
    lines: v.array(
      v.object({
        text: v.string(),
        urgency: v.union(
          v.literal("urgent"),
          v.literal("today"),
          v.literal("later"),
        ),
        messageId: v.id("messages"),
      }),
    ),
  },
  handler: async (ctx, args) => {
    return await digestService.upsert(ctx, args);
  },
});

export const markAudioGenerated = mutation({
  args: {
    digestId: v.id("digests"),
    audioUrl: v.string(),
    voiceUsed: v.string(),
  },
  handler: async (ctx, args) => {
    return await digestService.markAudioGenerated(
      ctx,
      args.digestId,
      args.audioUrl,
      args.voiceUsed,
    );
  },
});