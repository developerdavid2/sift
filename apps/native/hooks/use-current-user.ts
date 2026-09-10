"use client";

import { api } from "@sift/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";

export function useCurrentUser() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.get);

  return {
    isLoading: isLoading || (isAuthenticated && user === null),
    isAuthenticated: isAuthenticated && user !== null,
    user,
  };
}
