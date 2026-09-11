import { api } from "@sift/backend/convex/_generated/api";
import type { Id } from "@sift/backend/convex/_generated/dataModel";
import { useAction } from "convex/react";
import { useCallback } from "react";

export function useSyncInbox() {
  const syncInbox = useAction(api.gmail.entries.syncInbox);

  const syncAll = useCallback(
    async (inboxIds: Id<"connectedInboxes">[]): Promise<void> => {
      await Promise.all(inboxIds.map((inboxId) => syncInbox({ inboxId })));
    },
    [syncInbox],
  );

  return { syncAll };
}