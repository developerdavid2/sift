"use node";

import { internalAction } from "../_generated/server";
import { env } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_PROFILE_URL = "https://gmail.googleapis.com/gmail/v1/users/me/profile";

export type OAuthCallbackResult =
  | {
      ok: true;
      emailAddress: string;
      status: "connected" | "already-connected";
      returnUrl: string;
    }
  | { ok: false; error: string; returnUrl: string };

export type NativeConnectResult =
  | {
      ok: true;
      emailAddress: string;
      status: "connected" | "already-connected";
    }
  | { ok: false; error: string; retry?: true };

function oauthConfig() {
  return {
    clientId: env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    encryptionKey: env.GOOGLE_TOKEN_ENCRYPTION_KEY,
    redirectUri: `${env.CONVEX_SITE_URL}/api/gmail/callback`,
  };
}

type ExchangeResult =
  | { ok: true; accessToken: string; refreshToken: string | null }
  | { ok: false; error: string };

const REVOKE_URL = "https://oauth2.googleapis.com/revoke";

async function revokeGoogleAccess(accessToken: string): Promise<void> {
  try {
    await fetch(REVOKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: accessToken }).toString(),
    });
  } catch (error) {
    console.error("Gmail access token revocation failed:", error);
  }
}

async function exchangeAuthCode(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string | null,
): Promise<ExchangeResult> {
  const params: Record<string, string> = {
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
  };
  if (redirectUri) params.redirect_uri = redirectUri;

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });

  if (!tokenResponse.ok) {
    const body = await tokenResponse.text();
    console.error(
      "Gmail token exchange failed:",
      tokenResponse.status,
      body.slice(0, 500),
    );
    return {
      ok: false,
      error: `Google rejected the authorization code (HTTP ${tokenResponse.status}).`,
    };
  }

  const tokenJson = (await tokenResponse.json()) as {
    access_token?: string;
    refresh_token?: string;
  };
  if (!tokenJson.access_token) {
    return { ok: false, error: "Google did not return usable tokens." };
  }
  return {
    ok: true,
    accessToken: tokenJson.access_token,
    refreshToken: tokenJson.refresh_token ?? null,
  };
}

type ProfileResult =
  | { ok: true; emailAddress: string }
  | { ok: false; error: string };

async function fetchProfile(accessToken: string): Promise<ProfileResult> {
  const profileResponse = await fetch(GOOGLE_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!profileResponse.ok) {
    return { ok: false, error: "Could not read the connected inbox's profile." };
  }

  const profileJson = (await profileResponse.json()) as {
    emailAddress?: string;
  };
  if (!profileJson.emailAddress) {
    return {
      ok: false,
      error: "Could not determine the connected inbox's email address.",
    };
  }
  return { ok: true, emailAddress: profileJson.emailAddress };
}

export const handleOAuthCallback = internalAction({
  args: {
    code: v.optional(v.string()),
    state: v.string(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<OAuthCallbackResult> => {
    const { clientId, clientSecret, encryptionKey, redirectUri } =
      oauthConfig();

    if (!clientId || !clientSecret || !encryptionKey) {
      console.error("Gmail OAuth config missing on this deployment.");
      return {
        ok: false,
        error: "Server is missing Google OAuth configuration.",
        returnUrl: "",
      };
    }

    const stateRow = await ctx.runQuery(internal.gmail.internal.getOauthState, {
      state: args.state,
    });
    if (!stateRow) {
      return {
        ok: false,
        error: "This connection request is invalid or has expired. Please try again.",
        returnUrl: "",
      };
    }

    if (stateRow.expiresAt < Date.now()) {
      await ctx.runMutation(internal.gmail.internal.deleteOauthState, {
        state: args.state,
      });
      return {
        ok: false,
        error: "This connection request has expired. Please try again.",
        returnUrl: stateRow.returnUrl,
      };
    }

    if (args.error) {
      await ctx.runMutation(internal.gmail.internal.deleteOauthState, {
        state: args.state,
      });
      return {
        ok: false,
        error: "Access was not granted.",
        returnUrl: stateRow.returnUrl,
      };
    }

    if (!args.code) {
      return {
        ok: false,
        error: "Google returned an incomplete response.",
        returnUrl: stateRow.returnUrl,
      };
    }

    const exchange = await exchangeAuthCode(
      clientId,
      clientSecret,
      args.code,
      redirectUri,
    );
    if (!exchange.ok) {
      return {
        ok: false,
        error: exchange.error,
        returnUrl: stateRow.returnUrl,
      };
    }

    const profile = await fetchProfile(exchange.accessToken);
    if (!profile.ok) {
      return {
        ok: false,
        error: profile.error,
        returnUrl: stateRow.returnUrl,
      };
    }

    if (!exchange.refreshToken) {
      const existing = await ctx.runQuery(
        internal.gmail.internal.getConnectedInboxByEmail,
        { emailAddress: profile.emailAddress },
      );
      if (existing) {
        return {
          ok: true,
          emailAddress: profile.emailAddress,
          status: "already-connected",
          returnUrl: stateRow.returnUrl,
        };
      }
      return {
        ok: false,
        error:
          "Google did not issue offline access for this connection. Please try again.",
        returnUrl: stateRow.returnUrl,
      };
    }

    const encryptedTokens = await encrypt(encryptionKey, exchange.refreshToken);

    const save: {
      status: "connected" | "already-connected";
      emailAddress: string;
    } = await ctx.runMutation(internal.gmail.internal.saveConnectedInbox, {
      userId: stateRow.userId,
      state: args.state,
      emailAddress: profile.emailAddress,
      encryptedTokens,
    });

    return {
      ok: true,
      emailAddress: profile.emailAddress,
      status: save.status,
      returnUrl: stateRow.returnUrl,
    };
  },
});

export const completeNativeConnect = internalAction({
  args: {
    serverAuthCode: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args): Promise<NativeConnectResult> => {
    const { clientId, clientSecret, encryptionKey } = oauthConfig();
    if (!clientId || !clientSecret || !encryptionKey) {
      throw new Error("Gmail OAuth config missing on this deployment.");
    }

    const exchange = await exchangeAuthCode(
      clientId,
      clientSecret,
      args.serverAuthCode,
      null,
    );
    if (!exchange.ok) {
      return { ok: false, error: exchange.error };
    }

    const profile = await fetchProfile(exchange.accessToken);
    if (!profile.ok) {
      if (!exchange.refreshToken) {
        await revokeGoogleAccess(exchange.accessToken);
      }
      return { ok: false, error: profile.error };
    }

    if (!exchange.refreshToken) {
      const existing = await ctx.runQuery(
        internal.gmail.internal.getConnectedInboxByEmail,
        { emailAddress: profile.emailAddress },
      );
      if (existing) {
        return {
          ok: true,
          emailAddress: profile.emailAddress,
          status: "already-connected",
        };
      }
      await revokeGoogleAccess(exchange.accessToken);
      return {
        ok: false,
        retry: true,
        error:
          "Unlinked an old Google approval. Finishing your connection…",
      };
    }

    const encryptedTokens = await encrypt(encryptionKey, exchange.refreshToken);

    const save = await ctx.runMutation(
      internal.gmail.internal.saveConnectedInbox,
      {
        userId: args.userId,
        emailAddress: profile.emailAddress,
        encryptedTokens,
      },
    );

    return {
      ok: true,
      emailAddress: profile.emailAddress,
      status: save.status,
    };
  },
});

export const disconnectAndRevoke = internalAction({
  args: {
    userId: v.string(),
    inboxId: v.optional(v.id("connectedInboxes")),
  },
  handler: async (ctx, args): Promise<number> => {
    const { encryptionKey } = oauthConfig();

    const inboxes = await ctx.runQuery(
      internal.gmail.internal.listConnectedInboxesByUser,
      { userId: args.userId },
    );

    for (const inbox of inboxes) {
      if (args.inboxId && inbox._id !== args.inboxId) continue;
      try {
        if (!encryptionKey) {
          throw new Error("encryption key not configured");
        }
        const refreshToken = await decrypt(
          encryptionKey,
          inbox.encryptedTokens,
        );
        await revokeGoogleAccess(refreshToken);
      } catch (error) {
        console.error(
          "Failed to revoke Gmail grant for",
          inbox.emailAddress,
          error,
        );
      }
    }

    return await ctx.runMutation(
      internal.gmail.internal.disconnectInbox,
      { userId: args.userId, inboxId: args.inboxId },
    );
  },
});

async function encrypt(keyHex: string, plaintext: string): Promise<string> {
  const key = await importAesKey(keyHex, "encrypt");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toBufferSource(iv) },
    key,
    toBufferSource(data),
  );
  return `${toBase64(iv)}:${toBase64(new Uint8Array(encrypted))}`;
}

export async function decrypt(keyHex: string, payload: string): Promise<string> {
  const key = await importAesKey(keyHex, "decrypt");
  const parts = payload.split(":");
  const ivB64 = parts[0];
  const dataB64 = parts[1];
  if (!ivB64 || !dataB64) {
    throw new Error("Invalid encrypted payload");
  }
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toBufferSource(base64ToBytes(ivB64)) },
    key,
    toBufferSource(base64ToBytes(dataB64)),
  );
  return new TextDecoder().decode(plain);
}

function importAesKey(keyHex: string, usage: "encrypt" | "decrypt") {
  return crypto.subtle.importKey(
    "raw",
    toBufferSource(hexToBytes(keyHex)),
    { name: "AES-GCM" },
    false,
    [usage],
  );
}

function toBufferSource(value: Uint8Array<ArrayBufferLike>): ArrayBuffer {
  if (value.byteOffset === 0 && value.byteLength === value.buffer.byteLength) {
    return value.buffer as ArrayBuffer;
  }
  return value.slice().buffer;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.floor(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    const start = i * 2;
    bytes[i] = parseInt(hex.slice(start, start + 2), 16);
  }
  return bytes;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}