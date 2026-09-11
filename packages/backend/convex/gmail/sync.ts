"use node";

import { internalAction } from "../_generated/server";
import { env } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

import { decrypt, refreshAccessToken } from "./oauth";
import { classifyMessage } from "../classifications/scorer";

import type { Doc } from "../_generated/dataModel";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";
const MAX_MESSAGES_PER_RUN = 25;
const FIRST_SYNC_MESSAGES = 50;
const MAX_BODY_CHARS = 16_000;

export type SyncResult = {
  synced: number;
  skipped: number;
  classified: number;
  more: boolean;
};

const EMPTY_RESULT: SyncResult = { synced: 0, skipped: 0, classified: 0, more: false };

type MessageInsertCandidate = {
  gmailMessageId: string;
  threadId?: string;
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  body: string;
  receivedAt: number;
  isRead: boolean;
};

type ListPage = {
  ids: string[];
  historyId: string | null;
  nextPageToken: string | null;
};

type HistoryPage = {
  ids: string[];
  historyId: string | null;
};

export const syncInbox = internalAction({
  args: {
    inboxId: v.id("connectedInboxes"),
    pendingIds: v.optional(v.array(v.string())),
    pageToken: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<SyncResult> => {
    const inbox = await ctx.runQuery(
      internal.gmail.internal.getConnectedInboxById,
      { inboxId: args.inboxId },
    );
    if (!inbox) return EMPTY_RESULT;

    const access = await resolveAccessToken(inbox);
    if (!access.ok) {
      console.error(
        "[sift:sync]",
        inbox.emailAddress,
        "no access token:",
        access.error,
      );
      return EMPTY_RESULT;
    }

    let pendingIds = args.pendingIds ?? [];
    let pageToken: string | null = args.pageToken ?? null;
    let newHistoryId: string | null = null;

    if (pendingIds.length === 0) {
      if (pageToken) {
        const page = await fetchListPage(access.accessToken, pageToken);
        pendingIds = page.ids;
        pageToken = page.nextPageToken;
        newHistoryId = page.historyId;
      } else if (inbox.historyId) {
        const history = await fetchHistoryPage(
          access.accessToken,
          inbox.historyId,
        );
        newHistoryId = history.historyId;
        pendingIds = history.ids;
      } else {
        const page = await fetchListPage(access.accessToken, null);
        pendingIds = page.ids;
        pageToken = page.nextPageToken;
        newHistoryId = page.historyId;
      }
    }

    const batch = pendingIds.slice(0, MAX_MESSAGES_PER_RUN);
    const rest = pendingIds.slice(MAX_MESSAGES_PER_RUN);

    let synced = 0;
    let skipped = 0;
    let classified = 0;

    if (batch.length > 0) {
      const fetched: MessageInsertCandidate[] = [];
      for (const gmailMessageId of batch) {
        const message = await fetchFullMessage(access.accessToken, gmailMessageId);
        if (message) fetched.push(message);
      }

      if (fetched.length > 0) {
        const inserted = await ctx.runMutation(
          internal.messages.internal.insertMessages,
          { inboxId: args.inboxId, messages: fetched },
        );
        synced = inserted.created.length;
        skipped = inserted.skipped;

        if (inserted.created.length > 0) {
          const classifications = [];
          for (const { index, id } of inserted.created) {
            const candidate = fetched[index];
            if (!candidate) continue;
            const output = classifyMessage({
              sender: candidate.sender,
              senderEmail: candidate.senderEmail,
              subject: candidate.subject,
              snippet: candidate.snippet,
              body: candidate.body,
              receivedAt: candidate.receivedAt,
            });
            classifications.push({ ...output, messageId: id });
          }

          if (classifications.length > 0) {
            const result = await ctx.runMutation(
              internal.classifications.internal.insertClassifications,
              { classifications },
            );
            classified = result.inserted;
          }
        }
      }
    }

    const done = rest.length === 0 && pageToken === null;
    const historyId = newHistoryId ?? inbox.historyId ?? undefined;

    if (done) {
      await ctx.runMutation(internal.gmail.internal.updateInboxSyncState, {
        inboxId: args.inboxId,
        historyId,
        syncToken: null,
        lastSyncedAt: Date.now(),
      });
      return { synced, skipped, classified, more: false };
    }

    await ctx.runMutation(internal.gmail.internal.updateInboxSyncState, {
      inboxId: args.inboxId,
      ...(newHistoryId ? { historyId: newHistoryId } : {}),
      ...(pageToken ? { syncToken: pageToken } : {}),
      lastSyncedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.gmail.sync.syncInbox, {
      inboxId: args.inboxId,
      ...(rest.length > 0 ? { pendingIds: rest } : {}),
      ...(pageToken ? { pageToken } : {}),
    });

    return { synced, skipped, classified, more: true };
  },
});

async function resolveAccessToken(
  inbox: Doc<"connectedInboxes">,
): Promise<{ ok: true; accessToken: string } | { ok: false; error: string }> {
  const encryptionKey = env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!encryptionKey) {
    return { ok: false, error: "GOOGLE_TOKEN_ENCRYPTION_KEY not configured." };
  }

  let refreshToken: string;
  try {
    refreshToken = await decrypt(encryptionKey, inbox.encryptedTokens);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not decrypt tokens.",
    };
  }

  return await refreshAccessToken(refreshToken);
}

async function fetchListPage(
  accessToken: string,
  pageToken: string | null,
): Promise<ListPage> {
  const params = new URLSearchParams({
    maxResults: String(FIRST_SYNC_MESSAGES),
    q: "in:inbox",
  });
  if (pageToken) params.set("pageToken", pageToken);

  const response = await fetch(`${GMAIL_API}/messages?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`messages.list failed (HTTP ${response.status}).`);
  }

  const json = (await response.json()) as {
    messages?: { id?: string }[];
    nextPageToken?: string;
    historyId?: string;
  };

  return {
    ids: (json.messages ?? [])
      .map((entry) => entry.id)
      .filter((id): id is string => typeof id === "string"),
    historyId: json.historyId ?? null,
    nextPageToken: json.nextPageToken ?? null,
  };
}

async function fetchHistoryPage(
  accessToken: string,
  startHistoryId: string,
): Promise<HistoryPage> {
  const params = new URLSearchParams({
    startHistoryId,
    maxResults: "500",
    historyTypes: "messageAdded",
  });
  const response = await fetch(`${GMAIL_API}/history?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`history.list failed (HTTP ${response.status}).`);
  }

  const json = (await response.json()) as {
    history?: { messagesAdded?: { message?: { id?: string } }[] }[];
    historyId?: string;
  };

  const ids = new Set<string>();
  for (const entry of json.history ?? []) {
    for (const added of entry.messagesAdded ?? []) {
      if (added.message?.id) ids.add(added.message.id);
    }
  }

  return {
    ids: Array.from(ids),
    historyId: json.historyId ?? null,
  };
}

async function fetchFullMessage(
  accessToken: string,
  gmailMessageId: string,
): Promise<MessageInsertCandidate | null> {
  const response = await fetch(
    `${GMAIL_API}/messages/${gmailMessageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) {
    console.error(
      "[sift:sync] messages.get failed:",
      gmailMessageId,
      response.status,
    );
    return null;
  }

  const json = (await response.json()) as {
    id?: string;
    threadId?: string;
    snippet?: string;
    labelIds?: string[];
    internalDate?: string;
    payload?: { headers?: { name?: string; value?: string }[]; parts?: GmailBodyPart[]; body?: GmailBodyData };
  };

  if (!json.id) return null;

  const headers = (json.payload?.headers ?? []).reduce<Record<string, string>>(
    (acc, header) => {
      if (header.name && header.value && !(header.name in acc)) {
        acc[header.name] = header.value;
      }
      return acc;
    },
    {},
  );

  const from = headers["From"] ?? "";
  const subject = headers["Subject"] ?? "(no subject)";
  const dateHeader = headers["Date"] ?? "";
  const receivedAt =
    (json.internalDate ? Number(json.internalDate) : NaN) ||
    (dateHeader ? Date.parse(dateHeader) : NaN) ||
    Date.now();

  return {
    gmailMessageId: json.id,
    threadId: json.threadId,
    sender: nameFromHeader(from),
    senderEmail: emailFromHeader(from),
    subject,
    snippet: json.snippet ?? "",
    body: extractBody(json.payload).slice(0, MAX_BODY_CHARS),
    receivedAt,
    isRead: !(json.labelIds ?? []).includes("UNREAD"),
  };
}

type GmailBodyData = { data?: string };
type GmailBodyPart = { mimeType?: string; body?: GmailBodyData; parts?: GmailBodyPart[] };

function extractBody(payload: GmailBodyPart | undefined): string {
  const plains: string[] = [];
  const htmls: string[] = [];

  const stack: GmailBodyPart[] = payload ? [payload] : [];
  while (stack.length > 0) {
    const part = stack.pop()!;
    if (part.mimeType === "text/plain" && part.body?.data) {
      plains.push(decodeBase64Url(part.body.data));
    } else if (part.mimeType === "text/html" && part.body?.data) {
      htmls.push(decodeBase64Url(part.body.data));
    }
    if (part.parts) stack.push(...part.parts);
  }

  if (plains.length > 0) return plains.join("\n");
  if (htmls.length > 0) return stripHtml(htmls.join("\n"));
  return "";
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function nameFromHeader(value: string): string {
  const match = value.match(/^\s*(?:["'](.+?)["']\s*)?<[^>]+>/);
  if (match?.[1]) return match[1];
  const display = (value.split(/<[^>]+>/)[0] ?? "").trim();
  return display.replace(/^"|"$/g, "") || value.trim();
}

function emailFromHeader(value: string): string {
  const match = value.match(/<([^>]+@[^>]+)>/);
  if (match?.[1]) return match[1];
  return value.trim();
}