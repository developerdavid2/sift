/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as chatMessages_entries from "../chatMessages/entries.js";
import type * as chatMessages_repository from "../chatMessages/repository.js";
import type * as chatMessages_service from "../chatMessages/service.js";
import type * as classifications_entries from "../classifications/entries.js";
import type * as classifications_repository from "../classifications/repository.js";
import type * as classifications_service from "../classifications/service.js";
import type * as connectedInboxes_entries from "../connectedInboxes/entries.js";
import type * as connectedInboxes_repository from "../connectedInboxes/repository.js";
import type * as connectedInboxes_service from "../connectedInboxes/service.js";
import type * as conversations_entries from "../conversations/entries.js";
import type * as conversations_repository from "../conversations/repository.js";
import type * as conversations_service from "../conversations/service.js";
import type * as digests_entries from "../digests/entries.js";
import type * as digests_repository from "../digests/repository.js";
import type * as digests_service from "../digests/service.js";
import type * as feedback_repository from "../feedback/repository.js";
import type * as healthCheck_entries from "../healthCheck/entries.js";
import type * as http from "../http.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_types from "../lib/types.js";
import type * as messages_entries from "../messages/entries.js";
import type * as messages_repository from "../messages/repository.js";
import type * as messages_service from "../messages/service.js";
import type * as preferences_entries from "../preferences/entries.js";
import type * as preferences_repository from "../preferences/repository.js";
import type * as preferences_service from "../preferences/service.js";
import type * as privateData_entries from "../privateData/entries.js";
import type * as subscriptions_entries from "../subscriptions/entries.js";
import type * as subscriptions_repository from "../subscriptions/repository.js";
import type * as subscriptions_service from "../subscriptions/service.js";
import type * as users_entries from "../users/entries.js";
import type * as users_repository from "../users/repository.js";
import type * as users_service from "../users/service.js";
import type * as webhooks from "../webhooks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "chatMessages/entries": typeof chatMessages_entries;
  "chatMessages/repository": typeof chatMessages_repository;
  "chatMessages/service": typeof chatMessages_service;
  "classifications/entries": typeof classifications_entries;
  "classifications/repository": typeof classifications_repository;
  "classifications/service": typeof classifications_service;
  "connectedInboxes/entries": typeof connectedInboxes_entries;
  "connectedInboxes/repository": typeof connectedInboxes_repository;
  "connectedInboxes/service": typeof connectedInboxes_service;
  "conversations/entries": typeof conversations_entries;
  "conversations/repository": typeof conversations_repository;
  "conversations/service": typeof conversations_service;
  "digests/entries": typeof digests_entries;
  "digests/repository": typeof digests_repository;
  "digests/service": typeof digests_service;
  "feedback/repository": typeof feedback_repository;
  "healthCheck/entries": typeof healthCheck_entries;
  http: typeof http;
  "lib/errors": typeof lib_errors;
  "lib/types": typeof lib_types;
  "messages/entries": typeof messages_entries;
  "messages/repository": typeof messages_repository;
  "messages/service": typeof messages_service;
  "preferences/entries": typeof preferences_entries;
  "preferences/repository": typeof preferences_repository;
  "preferences/service": typeof preferences_service;
  "privateData/entries": typeof privateData_entries;
  "subscriptions/entries": typeof subscriptions_entries;
  "subscriptions/repository": typeof subscriptions_repository;
  "subscriptions/service": typeof subscriptions_service;
  "users/entries": typeof users_entries;
  "users/repository": typeof users_repository;
  "users/service": typeof users_service;
  webhooks: typeof webhooks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
