import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("pro")),
    planRenewsAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

  connectedInboxes: defineTable({
    userId: v.string(),
    emailAddress: v.string(),
    label: v.optional(v.string()),
    encryptedTokens: v.string(),
    syncToken: v.optional(v.string()),
    historyId: v.optional(v.string()),
    lastSyncedAt: v.optional(v.number()),
    status: v.union(v.literal("healthy"), v.literal("broken")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_emailAddress", ["emailAddress"]),

  messages: defineTable({
    inboxId: v.id("connectedInboxes"),
    gmailMessageId: v.string(),
    threadId: v.optional(v.string()),
    sender: v.string(),
    senderEmail: v.string(),
    subject: v.string(),
    snippet: v.string(),
    body: v.string(),
    receivedAt: v.number(),
    isRead: v.boolean(),
    isHandled: v.boolean(),
    snoozedUntil: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_inboxId", ["inboxId"])
    .index("by_gmailMessageId", ["gmailMessageId"])
    .index("by_receivedAt", ["receivedAt"]),

  classifications: defineTable({
    messageId: v.id("messages"),
    urgency: v.union(
      v.literal("urgent"),
      v.literal("today"),
      v.literal("later"),
    ),
    urgencyScore: v.number(),
    category: v.string(), // job_offer, deadline, meeting, invoice, newsletter, etc.
    reason: v.string(), // plain-English one-liner
    modelVersion: v.string(), // track scoring quality over time
    createdAt: v.number(),
  })
    .index("by_messageId", ["messageId"])
    .index("by_urgency", ["urgency"]),

  feedback: defineTable({
    messageId: v.id("messages"),
    userId: v.string(),
    type: v.union(
      v.literal("not_urgent"),
      v.literal("should_have_been_urgent"),
    ),
    createdAt: v.number(),
  })
    .index("by_messageId", ["messageId"])
    .index("by_userId", ["userId"]),

  preferences: defineTable({
    userId: v.string(), // unique per person
    vipEmails: v.array(v.string()),
    mutedCategories: v.array(v.string()),
    digestTime: v.string(), // "08:00" format
    timezone: v.string(), // IANA timezone
    quietHoursStart: v.optional(v.string()), // "22:00"
    quietHoursEnd: v.optional(v.string()), // "07:00"
    voiceCharacterId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  // ──────────────────────────────────────────────
  // digests — one row per person per day
  // ──────────────────────────────────────────────
  digests: defineTable({
    userId: v.string(),
    date: v.string(), // "2026-09-09" format
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
    audioGenerated: v.boolean(),
    audioUrl: v.optional(v.string()),
    voiceUsed: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_userId_and_date", ["userId", "date"]),

  // ──────────────────────────────────────────────
  // conversations — chat session containers
  // ──────────────────────────────────────────────
  conversations: defineTable({
    userId: v.string(),
    title: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  // ──────────────────────────────────────────────
  // chatMessages — individual messages in a conversation
  // ──────────────────────────────────────────────
  chatMessages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    text: v.string(),
    actionType: v.optional(v.string()), // if AI performed an action
    actionTarget: v.optional(v.string()), // what was affected
    createdAt: v.number(),
  }).index("by_conversationId", ["conversationId"]),

  // ──────────────────────────────────────────────
  // subscriptions — RevenueCat sync state
  // ──────────────────────────────────────────────
  subscriptions: defineTable({
    userId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro")),
    revenueCatId: v.string(),
    entitlements: v.array(v.string()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_revenueCatId", ["revenueCatId"]),
});
