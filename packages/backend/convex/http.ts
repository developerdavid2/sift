import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/api/gmail/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code") ?? undefined;
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error") ?? undefined;

    if (!state) {
      return new Response("Missing state parameter.", { status: 400 });
    }

    const result = await ctx.runAction(
      internal.gmail.oauth.handleOAuthCallback,
      { code, state, error },
    );

    if (!result.ok) {
      const dest = appendResult(result.returnUrl, "error", result.error);
      return new Response(redirectPage(dest, result.error), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const dest = appendResult(result.returnUrl, result.status);
    return new Response(redirectPage(dest, null), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }),
});

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
        await ctx.runMutation(internal.webhooks.upsertUserFromClerk, {
          data: event.data,
        });
        break;

      case "user.deleted": {
        await ctx.runMutation(internal.webhooks.deleteUserFromClerk, {
          clerkUserId: event.data.id!,
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

function redirectPage(returnUrl: string, message: string | null): string {
  const destination =
    returnUrl.length > 0 ? returnUrl : "https://sift.app/oauth-failed";

  const body = message
    ? `<p>${escapeHtml(message)}</p>`
    : "<p>Your inbox is connected. Returning you to Sift…</p>";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="0; url=${escapeAttr(destination)}" />
    <title>Sift</title>
    <style>
      body {
        font-family: system-ui, -apple-system, sans-serif;
        background: #0a0f14;
        color: #e7edf3;
        display: grid;
        place-items: center;
        min-height: 100vh;
        margin: 0;
        text-align: center;
      }
      main { max-width: 28rem; padding: 2rem; }
    </style>
  </head>
  <body>
    <main>
      <h1>${message ? "Connection not completed" : "Done — Sift is connected"}</h1>
      ${body}
      <noscript><a href="${escapeAttr(destination)}">Continue</a></noscript>
    </main>
  </body>
</html>`;
}

function appendResult(url: string, result: string, message?: string): string {
  if (!url.length) return "https://sift.app/oauth-failed";
  const separator = url.includes("?") ? "&" : "?";
  const params = new URLSearchParams({ result });
  if (message) params.set("message", message);
  return `${url}${separator}${params.toString()}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

export default http;