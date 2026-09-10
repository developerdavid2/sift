import type { Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../lib/types";
import { forbidden, notFound } from "../lib/errors";
import { userService } from "../users/service";
import { digestRepository } from "./repository";
import type { DigestInsert } from "./repository";

export type DigestLine = {
  text: string;
  urgency: "urgent" | "today" | "later";
  messageId: Id<"messages">;
};

export type DigestUpsertArgs = {
  date: string;
  lines: DigestLine[];
};

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10); // "2026-09-09"
}

async function getToday(ctx: QueryCtx) {
  const user = await userService.getCurrentUser(ctx);
  if (!user) return null;

  return await digestRepository.byUserIdAndDate(ctx, user.userId, todayDateString());
}

async function getByDate(ctx: QueryCtx, date: string) {
  const user = await userService.getCurrentUser(ctx);
  if (!user) return null;

  return await digestRepository.byUserIdAndDate(ctx, user.userId, date);
}

async function getRecent(ctx: QueryCtx) {
  const user = await userService.getCurrentUser(ctx);
  if (!user) return [];

  return await digestRepository.recentByUserId(ctx, user.userId, 7);
}

async function upsert(ctx: MutationCtx, args: DigestUpsertArgs) {
  const user = await userService.getCurrentUserOrThrow(ctx);

  const existing = await digestRepository.byUserIdAndDate(ctx, user.userId, args.date);
  if (existing) {
    await digestRepository.patch(ctx, existing._id, {
      lines: args.lines,
      audioGenerated: false,
      audioUrl: undefined,
    });
    return existing._id;
  }

  const insert: DigestInsert = {
    userId: user.userId,
    date: args.date,
    lines: args.lines,
    audioGenerated: false,
    createdAt: Date.now(),
  };

  return await digestRepository.insert(ctx, insert);
}

async function markAudioGenerated(
  ctx: MutationCtx,
  digestId: Id<"digests">,
  audioUrl: string,
  voiceUsed: string,
) {
  const user = await userService.getCurrentUserOrThrow(ctx);

  const digest = await digestRepository.byId(ctx, digestId);
  if (!digest) throw notFound("Digest");
  if (digest.userId !== user.userId) throw forbidden();

  await digestRepository.patch(ctx, digestId, {
    audioGenerated: true,
    audioUrl,
    voiceUsed,
  });

  return digestId;
}

export const digestService = {
  getToday,
  getByDate,
  getRecent,
  upsert,
  markAudioGenerated,
};