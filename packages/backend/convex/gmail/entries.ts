import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { env } from "../_generated/server";
import { v } from "convex/values";

import { AppError, forbidden, notAuthenticated } from "../lib/errors";

import type { DisconnectResult, NativeConnectResult } from "./oauth";
import type { SyncResult } from "./sync";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.modify";
const STATE_TTL_MS = 10 * 60 * 1000;
const ALLOWED_RETURN_URL_SCHEMES = new Set(["sift"]);
const ALLOWED_RETURN_URL_HOSTS = new Set(["localhost", "127.0.0.1"]);

export const startGmailConnect = action({
  args: { returnUrl: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw notAuthenticated();

    assertSafeReturnUrl(args.returnUrl);

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
  handler: async (ctx, args): Promise<DisconnectResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw notAuthenticated();

    return await ctx.runAction(internal.gmail.oauth.disconnectAndRevoke, {
      userId: identity.subject,
      inboxId: args.inboxId,
    });
  },
});

export const syncInbox = action({
  args: { inboxId: v.id("connectedInboxes") },
  handler: async (ctx, args): Promise<SyncResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw notAuthenticated();

    const inbox = await ctx.runQuery(
      internal.gmail.internal.getConnectedInboxById,
      { inboxId: args.inboxId },
    );
    if (!inbox || inbox.userId !== identity.subject) throw forbidden();

    return await ctx.runAction(internal.gmail.sync.syncInbox, {
      inboxId: args.inboxId,
    });
  },
});

async function generateState(): Promise<string> {
  return globalThis.crypto.randomUUID();
}

function assertSafeReturnUrl(value: string): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new AppError("INVALID_RETURN_URL", "The return URL is not valid.");
  }

  const scheme = url.protocol.replace(":", "");
  const isDeepLink = ALLOWED_RETURN_URL_SCHEMES.has(scheme);
  const isHttp = (scheme === "http" || scheme === "https")
    && ALLOWED_RETURN_URL_HOSTS.has(url.hostname);
  if (!isDeepLink && !isHttp) {
    throw new AppError(
      "DISALLOWED_RETURN_URL",
      "The return URL is not an allowed destination.",
    );
  }
}