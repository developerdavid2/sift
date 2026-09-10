import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const result = await validateRequest(request);
    if (!result.ok) {
      console.error("Webhook signature verification failed:", result.error);
      return new Response(`Error occured: ${result.error}`, { status: 400 });
    }

    const event = result.event;

    switch (event.type) {
      case "user.created":
      case "user.updated":
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: event.data,
        });
        break;

      case "user.deleted": {
        const clerkUserId = event.data.id!;
        await ctx.runMutation(internal.users.deleteFromClerk, {
          clerkUserId,
        });
        break;
      }

      default:
        console.log("Ignored Clerk webhook event", event.type);
    }

    return new Response(null, { status: 200 });
  }),
});

type ValidatedEvent =
  | { ok: true; event: WebhookEvent }
  | { ok: false; error: string };

async function validateRequest(req: Request): Promise<ValidatedEvent> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return { ok: false, error: "CLERK_WEBHOOK_SECRET is not set" };
  }

  const payloadString = await req.text();

  const svixHeaders = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  if (
    !svixHeaders["svix-id"] ||
    !svixHeaders["svix-timestamp"] ||
    !svixHeaders["svix-signature"]
  ) {
    return { ok: false, error: "Missing required svix headers" };
  }

  const wh = new Webhook(webhookSecret);
  try {
    // svix's `verify()` only throws on invalid signatures; it does NOT
    // return the parsed event (svix >= 2.4.0 returns void). Parse ourselves.
    wh.verify(payloadString, svixHeaders);
    const event = JSON.parse(payloadString) as unknown as WebhookEvent;
    return { ok: true, event };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export default http;
