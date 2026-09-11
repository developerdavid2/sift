import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { env } from "../_generated/server";
import { v } from "convex/values";

import { AppError, notAuthenticated } from "../lib/errors";

import type { NativeConnectResult } from "./oauth";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.modify";
const STATE_TTL_MS = 10 * 60 * 1000;

export const startGmailConnect = action({
  args: { returnUrl: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw notAuthenticated();

    const clientId = env.GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) {
      throw new AppError(
        "GOOGLE_OAUTH_NOT_CONFIGURED",
        "Google OAuth is not configured yet on this deployment.",
      );
    }

    const state = await generateState();

    await ctx.runMutation(internal.gmail.internal.upsertOauthState, {
      state,
      userId: identity.subject,
      returnUrl: args.returnUrl,
      expiresAt: Date.now() + STATE_TTL_MS,
    });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${env.CONVEX_SITE_URL}/api/gmail/callback`,
      response_type: "code",
      scope: GMAIL_SCOPE,
      access_type: "offline",
      prompt: "consent",
      state,
    });

    return { url: `${GOOGLE_AUTH_URL}?${params.toString()}` };
  },
});

export const completeNativeConnect = action({
  args: { serverAuthCode: v.string() },
  handler: async (ctx, args): Promise<NativeConnectResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw notAuthenticated();

    return await ctx.runAction(internal.gmail.oauth.completeNativeConnect, {
      serverAuthCode: args.serverAuthCode,
      userId: identity.subject,
    });
  },
});

export const disconnect = action({
  args: { inboxId: v.optional(v.id("connectedInboxes")) },
  handler: async (ctx, args): Promise<number> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw notAuthenticated();

    return await ctx.runAction(internal.gmail.oauth.disconnectAndRevoke, {
      userId: identity.subject,
      inboxId: args.inboxId,
    });
  },
});

async function generateState(): Promise<string> {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return [
    Date.now().toString(36),
    Math.random().toString(36).slice(2),
    Math.random().toString(36).slice(2),
  ].join("-");
}