import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    GOOGLE_OAUTH_CLIENT_ID: v.optional(v.string()),
    GOOGLE_OAUTH_CLIENT_SECRET: v.optional(v.string()),
    GOOGLE_TOKEN_ENCRYPTION_KEY: v.optional(v.string()),
  },
});

export default app;