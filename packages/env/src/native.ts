import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const convexUrlSchema = (exampleHost: string) =>
  z.url().refine((url) => new URL(url).hostname !== exampleHost, {
    message: `Replace the ${exampleHost} placeholder before running the app`,
  });

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_CONVEX_URL: convexUrlSchema("example.convex.cloud"),
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID: z.string().min(1),
    EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID: z.string().min(1),
    EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID: z.string().min(1),
  },
  runtimeEnv: {
    EXPO_PUBLIC_CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL,
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID:
      process.env.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID,
    EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID:
      process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID,
    EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID:
      process.env.EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID,
  },
  emptyStringAsUndefined: true,
});
