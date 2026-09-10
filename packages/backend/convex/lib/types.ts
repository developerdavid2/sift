import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Infer } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export type { QueryCtx, MutationCtx };

export type DbReader = QueryCtx["db"];
export type DbWriter = MutationCtx["db"];
export type PaginationOpts = Infer<typeof paginationOptsValidator>;