import { api } from "@sift/backend/convex/_generated/api";
import { useToast } from "heroui-native";
import { useAction } from "convex/react";
import { useCallback, useState } from "react";

export type DisconnectInboxState =
  | { status: "idle" }
  | { status: "disconnecting" }
  | { status: "disconnected" }
  | { status: "error"; message?: string };

export function useDisconnectInbox() {
  const [state, setState] = useState<DisconnectInboxState>({
    status: "idle",
  });
  const { toast } = useToast();
  const disconnectAction = useAction(api.gmail.entries.disconnect);

  const disconnect = useCallback(async () => {
    setState({ status: "disconnecting" });
    try {
      const removed = await disconnectAction({});
      console.log("[sift:disconnect] removed inboxes:", removed);
      setState({ status: "disconnected" });
      toast.show({
        variant: "success",
        label: "Inbox disconnected",
        description: "Gmail access has been revoked on Google's side too.",
      });
    } catch (error) {
      console.error("[sift:disconnect] error:", error);
      setState({ status: "idle" });
      toast.show({
        variant: "danger",
        label: "Couldn't disconnect",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong disconnecting your inbox.",
      });
    }
  }, [disconnectAction, toast]);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, disconnect, reset };
}