import type { FunctionArgs, FunctionReference } from "convex/server";
import { useQuery_experimental as useQueryEx } from "convex/react";

type UseQueryStateResult<Query extends FunctionReference<"query">> =
  | { data: undefined; isLoading: true; error: undefined }
  | { data: undefined; isLoading: false; error: Error }
  | { data: Query["_returnType"]; isLoading: false; error: undefined };

export function useQueryState<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query> | "skip",
): UseQueryStateResult<Query> {
  const state = useQueryEx({
    query,
    args,
    throwOnError: false,
  });

  if (state.status === "pending") {
    return { data: undefined, isLoading: true, error: undefined };
  }
  if (state.status === "error") {
    return { data: undefined, isLoading: false, error: state.error };
  }
  return { data: state.data, isLoading: false, error: undefined };
}
