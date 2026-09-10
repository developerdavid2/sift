/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as chatMessages from "../chatMessages.js";
import type * as classifications from "../classifications.js";
import type * as connectedInboxes from "../connectedInboxes.js";
import type * as conversations from "../conversations.js";
import type * as digests from "../digests.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as preferences from "../preferences.js";
import type * as privateData from "../privateData.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  chatMessages: typeof chatMessages;
  classifications: typeof classifications;
  connectedInboxes: typeof connectedInboxes;
  conversations: typeof conversations;
  digests: typeof digests;
  healthCheck: typeof healthCheck;
  http: typeof http;
  messages: typeof messages;
  preferences: typeof preferences;
  privateData: typeof privateData;
  subscriptions: typeof subscriptions;
  users: typeof users;
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
