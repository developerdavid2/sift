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
  },
  runtimeEnv: {
    EXPO_PUBLIC_CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL,
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
  emptyStringAsUndefined: true,
});
