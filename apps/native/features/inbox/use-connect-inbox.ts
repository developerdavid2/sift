import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { api } from "@sift/backend/convex/_generated/api";
import { env } from "@sift/env/native";
import { useToast } from "heroui-native";
import { useAction } from "convex/react";
import { useCallback, useState } from "react";
import { Platform } from "react-native";

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.modify";
const MAX_NATIVE_RETRIES = 1;

export type ConnectInboxState =
  | { status: "idle" }
  | { status: "connecting" }
  | { status: "connected" }
  | { status: "already-connected" }
  | { status: "canceled" }
  | { status: "error"; message?: string };

function isMissingNativeModuleError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("ExpoGoogleCredentialAuth") ||
      error.message.includes("native module"))
  );
}

export function useConnectInbox() {
  const [state, setState] = useState<ConnectInboxState>({ status: "idle" });
  const { toast } = useToast();
  const startGmailConnect = useAction(api.gmail.entries.startGmailConnect);
  const completeNativeConnect = useAction(api.gmail.entries.completeNativeConnect);

  const connectViaNative = useCallback(async (): Promise<
    "handled" | "module-unavailable"
  > => {
    try {
      const module = await import("expo-google-credential-auth");
      const GoogleAuth = module.default;
      GoogleAuth.configure({ webClientId: env.EXPO_PUBLIC_GOOGLE_CLIENT_ID });

      for (let attempt = 0; attempt <= MAX_NATIVE_RETRIES; attempt++) {
        const authorization = await GoogleAuth.requestAuthorization({
          scopes: [GMAIL_SCOPE],
          offlineAccess: true,
        });
        console.log("[sift:connect] authorization result:", {
          attempt,
          grantedScopes: authorization.grantedScopes,
          hasServerAuthCode: Boolean(authorization.serverAuthCode),
          serverAuthCodeLength: authorization.serverAuthCode?.length ?? 0,
        });

        if (!authorization.serverAuthCode) {
          if (authorization.grantedScopes.length > 0) {
            setState({
              status: "error",
              message:
                "Google didn't return an offline access code. Check the OAuth client configuration.",
            });
            toast.show({
              variant: "danger",
              label: "Couldn't connect",
              description: "Google didn't return an offline access code.",
            });
          } else {
            setState({ status: "canceled" });
            toast.show({
              variant: "default",
              label: "Connection canceled",
              description: "No changes were made.",
            });
          }
          return "handled";
        }

        const result = await completeNativeConnect({
          serverAuthCode: authorization.serverAuthCode,
        });
        console.log(
          "[sift:connect] completeNativeConnect result:",
          result,
        );

        if (result.ok) {
          setState(
            result.status === "already-connected"
              ? { status: "already-connected" }
              : { status: "connected" },
          );
          return "handled";
        }

        if (result.retry && attempt < MAX_NATIVE_RETRIES) {
          toast.show({
            variant: "default",
            label: "Finishing connection",
            description: "Unlinked an old Google approval — one moment.",
          });
          continue;
        }

        setState({ status: "error", message: result.error });
        toast.show({
          variant: "danger",
          label: "Couldn't connect",
          description: result.error,
        });
        return "handled";
      }

      return "handled";
    } catch (error) {
      if (isMissingNativeModuleError(error)) {
        return "module-unavailable";
      }
      console.error("[sift:connect] native auth error:", error);
      throw error;
    }
  }, [completeNativeConnect, toast]);

  const connect = useCallback(async () => {
    setState({ status: "connecting" });
    try {
      if (Platform.OS === "android" || Platform.OS === "ios") {
        const outcome = await connectViaNative();
        if (outcome === "handled") return;
      }

      const returnUrl = Linking.createURL("oauth-complete");
      const { url } = await startGmailConnect({ returnUrl });
      const result = await WebBrowser.openAuthSessionAsync(url, returnUrl);

      if (result.type !== "success" || !result.url) {
        setState({ status: "canceled" });
        return;
      }

      const query = Linking.parse(result.url).queryParams ?? {};
      switch (query.result) {
        case "connected":
          setState({ status: "connected" });
          break;
        case "already-connected":
          setState({ status: "already-connected" });
          break;
        case "error":
          setState({
            status: "error",
            message:
              typeof query.message === "string" ? query.message : undefined,
          });
          break;
        default:
          setState({ status: "connected" });
      }
    } catch (error) {
      console.error("[sift:connect] connect error:", error);
      setState({ status: "idle" });
      toast.show({
        variant: "danger",
        label: "Couldn't connect",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong starting the connection.",
      });
    }
  }, [startGmailConnect, connectViaNative, toast]);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, connect, reset };
}