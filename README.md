# Sift — Product & Build Handbook

This document is written so a designer, a developer, or a product manager can each pick it up and know exactly what we are building, why, and how the pieces connect. Plain language throughout — no jargon without an explanation next to it the first time it shows up.

---

## 1. What Sift Is

Sift watches one or more Gmail inboxes on a person's behalf, decides what actually matters (a job offer, a deadline, a message from someone important), and tells the person about only that — either as a quiet push notification, a short spoken daily summary, or a chat you can ask questions to. Everything else stays out of the way.

**Who it's for:** job seekers, freelancers, and busy professionals who get too much email to read all of it, but can't afford to miss the one message that matters.

**The one thing that makes this different from "just another inbox app":** a person can watch inboxes that are not the one they signed up with. A freelancer might sign into Sift with a personal Google account, but actually want Sift watching three different client inboxes. The app is built around that from day one, not bolted on later.

---

## 2. The Core Idea That Shapes Everything: Identity vs. Watched Inbox

Two different things are happening, and they must never be treated as the same thing in the code or the design:

1. **Signing in** — proving who is using the app. Handled by Clerk, using their new native Google Sign-In (a fast, one-tap system dialog on iOS and Android — no browser popup). This only confirms identity. It does **not** hand over any permission to read email.
2. **Connecting an inbox** — a separate, deliberate step where a person picks a Gmail account and explicitly grants Sift permission to read messages from it. This uses Google's own consent screen (the "Sift wants to view your email" screen), and a person can repeat this step as many times as they want, each time pointing at a different Gmail account.

A person can connect zero, one, or several inboxes. Each connected inbox is tracked, synced, and billed against usage limits completely separately from the others, even though they all belong to the same signed-in person.

---

## 3. People Using the App (Personas)

- **The Freelancer** — juggles 2-3 client inboxes plus their own, terrified of missing a scope change or invoice question buried in noise.
- **The Job Seeker** — has one Gmail inbox, is applying to dozens of roles, and the one email that matters most (an offer, an interview request) looks identical in the inbox list to fifty newsletters.
- **The Busy Professional** — one work inbox, wants a spoken summary in the morning instead of scrolling before their first meeting.

---

## 4. Screens & Navigation Map

**Two navigation zones:** a one-time onboarding flow, and a persistent 4-tab main area.

### Onboarding (shown once, before the tabs exist)

1. Splash / Welcome
2. Sign in (native Google Sign-In via Clerk)
3. What Sift does (permissions explainer, sets expectations before asking for anything)
4. Connect your first inbox (this is where the _second_, separate Gmail permission step happens)
5. First sync in progress (real progress, not a fake spinner)

### Main tabs

- **Inbox tab:** Priority Inbox Home → Message Detail → Snooze/Mark Handled (sheet)
- **Digest tab:** Daily Digest → Digest Playback (voice)
- **Chat tab:** AI Chat/Voice Agent (new — see section 8)
- **Settings tab:** Settings Home → Notification Preferences → Connected Inboxes (supports many) → VIP Senders → Category Rules → Voice Character Picker → Profile → Subscription/Billing

### Supporting, non-tab screens

- Add Another Inbox (reachable from Connected Inboxes, and from a paywall if the limit is reached)
- Paywall Sheet (a bottom sheet, not a full screen — shown whenever a locked feature is tapped)
- Empty State ("all caught up") — a state of the Inbox screen, not a separate route
- Walkthrough Overlay — a state layered on top of Inbox Home the first time a person lands there, not a separate route

---

## 5. Visual & Interaction Spec, Screen by Screen

Read each entry as: what's on screen, how it's arranged, what it looks like at rest, and what happens when someone touches it.

### 5.1 Splash / Welcome

- **Background:** solid deep background color (`background` token), no imagery, no gradient — calm first impression.
- **Layout:** wordmark centered vertically at roughly 40% down the screen. Tagline directly beneath it, small caption size. Two buttons pinned near the bottom, safe-area aware.
- **Shadow/depth:** none — this screen is intentionally flat.
- **Animation:** wordmark letters fade and settle upward with a slight spring, staggered ~50ms per letter. Tagline fades in 200ms after. Buttons slide up from just below the screen edge.
- **Gesture:** tap only, no swipe behavior on this screen.

### 5.2 Sign In

- **Layout:** same calm background, header text, then a single prominent "Continue with Google" control — this is the native system button/sheet, not a custom-styled button, so it inherits the OS's own look (this is a strength, not a limitation — it reads as trustworthy).
- **Focus state:** the native control handles its own focus ring per-platform; do not restyle it.
- **Micro-copy beneath:** a single reassuring line — "We only ask to read email after you say yes, separately." This is the first moment the identity vs. inbox distinction is introduced to the person.

### 5.3 What Sift Does (Explainer)

- **Layout:** three short rows, each with a small line-icon on the left and one sentence on the right. No paragraphs.
- **Geometry:** icons sit inside a soft, rounded square (12px corner radius), using the `brand-primary` color at low opacity as the icon's background tint.
- **Animation:** rows fade up one at a time, 100ms apart, as the screen appears.
- **Primary action:** a single full-width button, "Continue." No skip option here — this is expectation-setting, not a real permission request yet.

### 5.4 Connect Your First Inbox

- **Layout:** a card in the center showing a Google "G" mark, the label "Connect a Gmail inbox," and a button, "Choose an account." Beneath it, small text: "You can connect more inboxes later, including ones different from the one you signed in with."
- **What happens on tap:** this opens Google's own consent screen through a secure in-app browser session (not the native one-tap sign-in — this is a full OAuth screen, because it's asking for a real, ongoing permission, not just identity). The person picks _any_ Google account here, signed in or not.
- **States:** a loading state while the browser session opens; a success state (green check, label switches to the connected email address) once permission is granted; an error state with a plain-language retry ("That didn't go through — try again?") if it's cancelled or denied.
- **Shadow:** the card has a soft, low elevation shadow (`shadow-sm` equivalent) to separate it from the flat background — this is the first screen where something feels "liftable."

### 5.5 First Sync In Progress

- **Layout:** a circular progress ring, center screen, with a number in the middle counting up ("142 of 340"). Status text beneath cycles through short phrases ("Looking for deadlines…", "Checking for job offers…").
- **Animation:** the ring fills with a spring-based easing, not linear — small overshoot at each update feels alive rather than robotic. Status text crossfades, never hard-cuts.
- **Exit condition:** auto-advances once the real count finishes or a timeout is hit — never leaves someone staring at 100% with no transition.

### 5.6 Priority Inbox Home

- **Layout, top to bottom:** a greeting line, a bell icon (top-right) for notification history, a horizontal row of filter chips ("Urgent · 3", "Today · 7", "Job Offers · 1", "Everything Else"), then a vertical scrolling stack of message cards.
- **Multi-inbox detail:** if more than one Gmail account is connected, an extra small filter row appears above the chips — a horizontal row of small circular avatars/initials, one per connected inbox, plus an "All" option selected by default. Tapping one filters the feed to just that inbox.
- **Message card layout:** sender avatar/initials (left), sender name + subject stacked (center, subject bold if unread), a one-line plain-English reason from the AI beneath the subject ("Deadline in 2 days"), an urgency dot + label (top-right of the card).
- **Card geometry:** 16px corner radius, 1px hairline border in the `border` token color, soft shadow only when the card is being dragged (not at rest — at rest, cards are flat and separated by spacing, not shadow, which keeps a long list from feeling heavy).
- **Urgency indicator:** a small filled dot to the left of the label — red for urgent, amber for "today," gray for "later." If the AI's confidence is high (score 9 or above), the dot has a slow, subtle pulse (scale 1.0 to 1.08 and back, ~2 second loop) — used sparingly, only for the most urgent items, so it never becomes visual noise.
- **Gestures:**
  - Swipe right → mark handled. Card slides fully off-screen to the right with a spring, a green checkmark flashes briefly where the card was, then the list collapses the gap.
  - Swipe left → reveals a clock icon behind the card; releasing opens the snooze sheet (5.7).
  - Pull down at the top of the list → refresh, with a custom small animated icon (not the default OS spinner) — triggers a manual sync check.
  - Tap anywhere on the card (not on the swipe area) → opens Message Detail.
- **Empty state:** when the filtered list has zero items, replace the list with a centered illustration, "All caught up," and a subtext. A gentle looping animation (soft floating shapes) — never static.

### 5.7 Snooze / Mark Handled (Bottom Sheet)

- **Presentation:** slides up from the bottom, rounded top corners (20px), a small horizontal grab handle centered at the top, backdrop behind it fades to ~40% dark.
- **Options, each a full-width row with an icon:** Snooze 1 hour, Snooze 3 hours, Snooze until tomorrow, Mark as handled (green icon), Move to archive (gray icon). Cancel as a separate, lower-emphasis row at the bottom.
- **Animation:** sheet uses spring physics on entry and on dismiss (drag-to-dismiss should feel natural, not just a fade).

### 5.8 Message Detail

- **Layout:** back arrow + sender name in the header. Subject as a large headline beneath. A tinted summary card right under the subject — background uses `brand-primary` at very low opacity — containing one AI-written sentence explaining the email in plain terms. Below that, the actual email body, cleaned up (signatures and footers stripped, not shown).
- **Action row, pinned near the bottom:** Reply, Mark Done, Snooze, Not Important — evenly spaced, icon above label, no borders between them (just spacing).
- **"Not Important" behavior:** tapping it doesn't just hide the email — it visibly shows a small confirmation toast ("Got it, we'll learn from this") so the person understands the AI is adjusting because of their tap.

### 5.9 Daily Digest

- **Layout:** date at the top, then 3-5 short lines, each written as a complete plain-English sentence, each with a small colored dot matching the urgency system. Generous line spacing — this screen should feel like reading a short note from a person, not scanning a table.
- **Bottom:** one large circular "Play" button, centered, with a subtle shadow to make it feel tappable and separate from the flat list above it.

### 5.10 Digest Playback

- **Layout:** same digest text, but now the Play button has morphed into four short vertical bars (a simplified waveform), animating height in a wave pattern while audio plays.
- **Highlight behavior:** whichever sentence is currently being read gets a soft left-edge color bar and a very slight background tint — turns off when that sentence finishes, moves to the next. This should feel like karaoke-style following, not a jarring highlight jump.
- **Controls:** pause (tap the waveform), skip to next point (small forward icon), and a voice character label showing which voice is currently reading (tapping it jumps to the Voice Character Picker).

### 5.11 AI Chat / Voice Agent

- **Layout:** a standard chat thread — the person's messages right-aligned in a filled bubble using `brand-primary`, the AI's replies left-aligned in a neutral `surface`-colored bubble. A text input pinned at the bottom, with a microphone icon inside it for voice input, and a send icon that only appears once there's text.
- **Voice mode:** tapping the microphone switches the input area into a large, centered "listening" state — a soft pulsing circle indicates active listening, replacing the keyboard entirely until the person taps to stop or pauses speaking long enough that it auto-submits.
- **When the AI takes an action (not just talks):** for example, if someone says "snooze everything from Acme until tomorrow," the reply bubble shows a small distinct action confirmation chip beneath the text ("Snoozed 4 emails") rather than just describing it in words — this makes it visually obvious something real happened, not just a chat response.
- **Empty state (first time opening chat):** a few example prompt suggestions as tappable chips ("What's urgent today?", "Any job offers this week?") so the person isn't staring at a blank input wondering what to say.

### 5.12 Settings Home

- **Layout:** a simple grouped list, sections separated by small uppercase section headers ("Account," "Inboxes," "Notifications," "Personalization," "Subscription"). Each row has a label, sometimes a value on the right (like the current plan name), and a chevron.

### 5.13 Connected Inboxes

- **Layout:** one row per connected Gmail account — small Google mark, the email address, a green "connected" dot, and a toggle or "disconnect" action. Beneath the list, an "Add another inbox" button.
- **Locked state (free tier, limit reached):** the "Add another inbox" button still appears, but tapping it opens the Paywall Sheet instead of the connect flow — never hide the option entirely, always show what's possible and what it costs to unlock.

### 5.14 Paywall Sheet

- **Presentation:** bottom sheet, same physics as the snooze sheet, for consistency.
- **Layout:** a short headline naming the specific thing being unlocked ("Connect a second inbox" — always specific to what triggered it, never a generic "Upgrade to Pro"), a short 2-3 line benefit list, the price, and one full-width "Upgrade" button. A small "Not now" text link beneath, never hidden or hard to find.

### 5.15 Voice Character Picker

- **Layout:** a vertical list of voice cards, each with a name, a one-line personality description ("Calm Narrator — steady and quiet"), and a small play button to preview a short sample line in that voice.
- **Locked state (free tier):** all but the default device voice show a small lock icon in place of the play button; tapping any locked one opens the Paywall Sheet.

### 5.16 Walkthrough Overlay

- **Presentation:** a dark, semi-transparent layer over the real Inbox Home screen, with a cut-out "spotlight" around one real element at a time.
- **Copy style:** framed around value, not mechanics — "Tap here to see only what needs a reply today," never "This is the filter chip."
- **Controls:** a `1 of 4` progress dot row, a visible Skip in the corner at every step, Next/Done button at the bottom of the callout bubble.

---

## 6. Reusable Components

Built on top of HeroUI Native's base primitives, styled with the Sift color tokens — this keeps us from reinventing basics like buttons and switches while still looking distinct.

| Component           | Built from                                 | Key properties                                                                  | Notes                                                              |
| ------------------- | ------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `PriorityBadge`     | HeroUI `Chip`                              | `level` (urgent / today / later), `pulsing` (true/false)                        | Used in cards and filter chips                                     |
| `EmailCard`         | HeroUI `Card` + gesture wrapper            | `sender`, `subject`, `reason`, `level`, `isRead`, `onSwipeRight`, `onSwipeLeft` | The core list item, reused in Inbox and Search                     |
| `ActionSheet`       | HeroUI `Sheet`                             | `options[]`, `onSelect`, `onCancel`                                             | Reused for snooze, archive, any bottom-sheet choice                |
| `PaywallSheet`      | HeroUI `Sheet`                             | `featureName`, `benefits[]`, `price`, `onUpgrade`                               | Always specific to the triggering feature, never generic           |
| `EmptyState`        | Custom, illustration + HeroUI `Text`       | `icon`, `title`, `subtitle`, `action?`                                          | Reused for "all caught up," "no results," "no inboxes connected"   |
| `VoicePicker`       | Custom list of HeroUI `ListItem`           | `voices[]`, `selectedId`, `locked`, `onSelect`, `onPreview`                     | Locked state swaps play icon for a lock icon                       |
| `InboxSourcePicker` | Custom, horizontal `ScrollView` of avatars | `accounts[]`, `selectedId`, `onSelect`                                          | Only renders if more than one inbox is connected                   |
| `ChatBubble`        | HeroUI `Card` variant                      | `role` (user / assistant), `text`, `actionChip?`                                | The action chip only appears when a tool call actually ran         |
| `UsageLimitBanner`  | Custom, inline banner                      | `message`, `ctaLabel`, `onPress`                                                | Shown inline in a feed, not a popup, when a free-tier limit is hit |

---

## 7. Data Model (Convex tables, described in plain terms)

Each table below is a category of thing being stored. Fields are described by what they hold, not by data type — this way it can be implemented in any backend, not just Convex.

**`users`** — one row per signed-in person.

- their Clerk identity reference
- display name, avatar
- which subscription plan they're on (free or pro), and when it renews

**`connectedInboxes`** — one row per Gmail account someone has granted permission to. A single person can have several of these.

- which person it belongs to
- the Gmail address
- a friendly label the person can set ("Work," "Freelance Client A")
- the stored permission tokens for reading that inbox (kept encrypted, never shown in the UI)
- where the sync is currently up to for this inbox (a marker so we only ever fetch what's new)
- when it was last successfully checked, and whether it's currently in a healthy or broken state (e.g., permission revoked)

**`messages`** — one row per email that has been read and processed. Always linked to a `connectedInboxes` row, never directly to a person — this is what makes multiple inboxes safely coexist.

- sender, subject, short preview, cleaned body text
- when it arrived
- whether it's been read, marked handled, or is currently snoozed (and until when)

**`classifications`** — one row per message, holding what the AI decided about it.

- how urgent it is, on a simple scale
- which category it falls into (job offer, deadline, meeting, invoice, newsletter, etc.)
- the one-sentence plain-English reason shown in the UI
- which version of the scoring approach produced this, so we can track quality over time

**`feedback`** — one row every time a person corrects the AI ("not important," or manually marks something urgent that wasn't flagged).

- which message it relates to
- what kind of correction it was
- this table is the raw material for improving the system over time, even if we don't build automatic learning from it in the first version

**`preferences`** — one row per person, their personal settings.

- which senders are VIPs (get an automatic urgency boost)
- which categories they care about vs. want muted
- what time their daily digest should be ready
- quiet hours (don't notify during this window even if something urgent lands)
- which voice character they've picked for playback

**`digests`** — one row per person per day.

- the short list of plain-English lines generated for that day
- whether audio has been generated for it yet, and which voice was used

**`conversations`** and **`chatMessages`** — the AI chat/voice agent's memory.

- a conversation belongs to a person
- each message in it records who said it (person or AI) and, if the AI actually performed an action rather than just replying, what that action was and what it affected

**`subscriptions`** — a record of what RevenueCat has told us about a person's plan, kept in sync so the app doesn't need to ask RevenueCat directly every time it needs to check access.

---

## 8. The Actual Logic (queries, mutations, actions — in plain terms)

Convex splits logic into three flavors. It matters which one something is, because it determines what that piece of logic is allowed to do:

- **A query** only reads and displays data. It updates the screen live the moment the underlying data changes — nothing needs to be manually refreshed. It is never allowed to reach out to Gmail, an AI provider, or anything outside the database.
- **A mutation** changes data in the database directly — marking something handled, saving a preference. Fast and safe, but also never allowed to talk to an outside service.
- **An action** is the only place allowed to talk to the outside world — calling the Gmail API, calling the AI provider, calling ElevenLabs for voice, calling RevenueCat. An action typically finishes by handing its result to a mutation to actually save it.

### Reading (queries)

- Get the ranked priority feed for a person, optionally filtered to one connected inbox
- Get a single message's full detail
- Search across messages by sender, subject, or category
- Get today's digest
- Get the list of a person's connected inboxes and their health status
- Get a person's current plan and usage counts, for deciding what to lock in the UI

### Writing (mutations)

- Mark a message handled
- Snooze a message until a specific time
- Record a "not important" or "should have been urgent" correction
- Save updated preferences (VIPs, categories, quiet hours, digest time, voice choice)
- Rename or remove a connected inbox
- Save the latest known subscription state (called by the action that talks to RevenueCat)

### Reaching outside the app (actions)

- Check one connected inbox for new mail, using its saved sync marker so only new messages are pulled, then hand each new message to the classification step
- Ask the AI provider to score a single message's urgency and category, then save the result
- Ask the AI provider to write today's digest lines from the day's most important messages, then save it
- Turn a digest into spoken audio using either the on-device voice (free) or a chosen ElevenLabs voice (paid), then save where that audio lives
- Send a push notification, but only after checking that the person's quiet hours and preferences actually allow it
- Handle an incoming message in the chat/voice agent: understand what the person is asking, and if it requires taking a real action (like snoozing a batch of emails), actually call the relevant mutations, then reply describing what was done
- Exchange a freshly granted Gmail permission for the tokens needed to keep reading that inbox going forward, and refresh those tokens before they expire
- Receive and process a RevenueCat webhook when someone subscribes, cancels, or their payment fails, and update their stored plan accordingly

---

## 9. How Connecting a Gmail Inbox Actually Works, Step by Step

This is the part most likely to be built wrong if it isn't spelled out, so here it is in full:

1. The person taps "Connect a Gmail inbox" (either during onboarding or later from Connected Inboxes).
2. On Android and iOS, the app asks Google through the operating system's native account system directly — **Credential Manager + Google Identity Services** on Android and the **GoogleSignIn SDK** on iOS (via `expo-google-credential-auth`), so the person sees the system account sheet, not a browser. On web (or if the native module isn't available, e.g. Expo Go), it falls back to a secure in-app browser session pointed at Google's own permission screen. Whether native or browser, this is deliberately separate from the identity-only sign-in used to log into the app.
3. The person picks any Google account — it does not need to match the account they used to log into Sift.
4. Google returns a short-lived one-time server auth code. Native and browser paths both end here: the code is handed to an action.
5. The app hands that code to `gmail.entries.completeNativeConnect` (native) or the `GET /api/gmail/callback` HTTP route (browser), either of which exchanges it with Google for a long-lived permission (a refresh token) and a short-lived access pass. Only the long-lived one is stored (encrypted with `GOOGLE_TOKEN_ENCRYPTION_KEY`) — access passes are re-requested behind the scenes whenever needed and are never kept around.
6. A new row is created in `connectedInboxes`, linked to the signed-in person, holding the Gmail address, the encrypted permission, and a starting point for syncing.
7. The first sync begins immediately, pulling recent mail and running each new message through classification.
8. From this point forward, a recurring background check (see section 11) revisits this specific inbox on its own schedule, completely independent of any other inbox the person may have connected.

If a person tries to connect an inbox that's already connected (by them or, in a future version, potentially someone else), the app should recognize the duplicate and simply show it as already connected rather than creating a second copy.

**Two wrinkles we've already handled, so they stay invisible to the user:**

- **Google's refresh-token suppression.** If a person has previously approved this app for the same account + scopes (even after revoking on our side), Google will not hand out a second refresh token. The backend detects this, revokes the lingering grant on Google's side in the background, and returns a `retry` signal — the client automatically runs one more authorization round and finishes the connect in a single button press, showing at most a "Unlinked an old Google approval" toast.
- **Disconnect truly unlinks.** `gmail.entries.disconnect` is an action that decrypts the stored permission and revokes it with Google *before* deleting the rows, so connect/disconnect loops never accumulate stale grants.

---

## 10. The AI Chat & Voice Agent

This is the feature that turns Sift from "a smart inbox" into "something you can talk to about your inbox."

- The agent has a fixed, limited set of real actions it's allowed to take — it can look up messages, summarize them, mark them handled, and snooze them. It cannot do anything the interface itself couldn't already do; it's a faster way to trigger the same real actions, not a separate power.
- Every time the agent actually performs one of those actions rather than just answering a question, the chat visibly shows what happened (the action chip described in section 5.11) — this builds trust, because the person can always see the difference between "the AI told me something" and "the AI changed something."
- Voice mode converts speech to text on the way in, runs through the same agent logic as typed chat, and can optionally read the reply back out loud using whichever voice character is active.
- This entire tab is a Pro-only feature (see monetization below) — it's the most computationally expensive part of the app, and gating it here is both a real cost-control decision and a strong incentive to upgrade.

---

## 11. Notifications, Sync Timing, and Background Work

Convex has scheduled functions and recurring jobs built in — a separate task runner is not needed for this app.

- **Recurring inbox checks:** a scheduled job runs every couple of minutes, and for each connected inbox that's due for a check, kicks off the "check for new mail" action for that specific inbox.
- **Daily digest generation:** a scheduled job runs once a day, generating a digest for anyone whose preferred digest time has arrived (checked against their own timezone/preference, not a single global time).
- **Permission refresh:** a scheduled job periodically checks connected inboxes for permissions nearing expiry and refreshes them quietly in the background, so a person is never surprised by a broken connection.
- **Incoming webhooks:** two outside services need to reach into the app directly, rather than the app polling them —
  - Clerk sends a signal when a person's account changes (e.g., they delete their account, which should trigger cleanup of their data).
  - RevenueCat sends a signal the moment someone subscribes, cancels, or a payment fails — this is how the app's stored plan status stays accurate without constantly asking RevenueCat "has anything changed?"

  Both are received through a small set of dedicated web addresses the app exposes for exactly this purpose, each one checking that the signal really came from Clerk or RevenueCat (not somebody pretending to be them) before acting on it.

---

## 12. Monetization Strategy

**Guiding rule:** never hide that something exists. Always show the locked feature, with a clear, specific reason it's locked and a one-tap path to unlock it. Nothing should feel broken — it should feel like a door with a visible handle.

### Free plan

- One connected Gmail inbox
- A daily cap on how many new messages get AI-classified per day (protects AI costs; once hit, new mail still arrives but waits until the next day to be scored, shown via an inline banner rather than silently)
- Daily digest available as text and read aloud only with the on-device voice
- Basic VIP list, capped at a small number of entries
- No access to the Chat/Voice Agent tab (shown in the tab bar, but tapping it opens the Paywall Sheet instead of the chat)

### Pro plan (monthly subscription, sold through RevenueCat)

- Multiple connected inboxes, up to a set limit
- No daily classification cap
- Full access to premium ElevenLabs voice characters
- Full access to the Chat/Voice Agent
- Unlimited VIPs and custom category rules

### Where locking shows up in the interface

- **Connected Inboxes screen:** "Add another inbox" opens the paywall once the free limit is reached, instead of the connect flow.
- **Voice Character Picker:** locked voices show a lock icon instead of a play button.
- **Chat tab:** tapping it while on the free plan opens the paywall sheet immediately, framed around what the agent can do, rather than a grayed-out empty chat.
- **Inline usage banner:** appears directly in the Inbox feed, not as a popup, when the daily classification cap is hit — this respects that someone is in the middle of using the app rather than interrupting them.

### Store compliance note

Since this is a digital subscription bought from inside a native app, it must go through Apple's and Google's own purchase systems rather than a direct card charge — this is a hard platform rule, not a preference. RevenueCat sits in front of both stores' purchase systems so the app only needs to talk to one thing, and it's the piece that tells the backend, via webhook, the moment a plan actually changes.

---

## 13. How the Project Should Be Structured (so removing a feature doesn't break another)

**Backend, grouped by subject, not by type** — one file per topic (inboxes, messages, classification, digests, preferences, chat agent, billing, scheduled jobs, incoming webhooks), so the classification logic, for example, lives in exactly one place and nothing about billing or chat needs to change if it's edited.

**Frontend, grouped by feature, not by file type** — rather than one giant folder of components used everywhere, each feature area (inbox, digest, chat, settings, billing) owns its own small set of components and logic, and only pulls from a small shared set of truly universal pieces (buttons, badges, sheets, empty states). This means deleting the entire chat feature, for instance, should be close to deleting one folder, not hunting through the whole app for stray references.

**Build order, feature by feature, backend before interface each time:** See **Section 16: Implementation Roadmap** for the detailed phase-by-phase build plan with exact screen names, components, and backend dependencies.

### RN Styling Paradigm: Tailwind CSS vs. StyleSheet

We blend Tailwind CSS (via NativeWind) and React Native's native `StyleSheet` API. This strict architectural boundary applies to all UI components.

**1. Tailwind CSS (NativeWind) — The Default Choice**
Use Tailwind CSS utility classes (`className="..."`) for **80-90% of all UI code**, focusing entirely on presentation, layouts, and typography.
* **Layouts & Spacing:** Always use Tailwind for Flexbox (`flex-1`, `items-center`), grid systems, margins, paddings, and alignment.
* **Design Tokens:** Always use Tailwind for background colors, typography sizes/weights, borders, border-radius, and absolute positioning constraints.
* **Component States:** Use Tailwind for conditional rendering strings (e.g., `className={\`p-4 ${isActive ? 'bg-blue-600' : 'bg-gray-200'}\`}`).

**2. StyleSheet.create() — The Functional Exception**
Reserve `StyleSheet.create` exclusively for edge cases where Tailwind cannot operate due to compilation limits, deep prop trees, or heavy runtime logic.
* **Dynamic Calculations:** Use StyleSheet when a value depends on explicit runtime math, device measurements, or state interpolation (e.g., `width: (windowWidth - 32) / 3`).
* **Platform-Specific Logic:** Use StyleSheet when branching styling deeply based on `Platform.select({ ios: ..., android: ... })` (e.g., native shadows, elevations).
* **Deep Component Props:** Use StyleSheet for sub-container props that strictly demand an Object instead of a string (e.g., `contentContainerStyle`, `columnWrapperStyle` in FlatLists/ScrollViews).
* **Animations:** Use StyleSheet or inline styles when binding styles directly to Reanimated shared values or layout animation nodes.

**3. Implementation Example**
When writing components, combine them gracefully. Apply layout utilities inline and pass functional overrides as an array to `style`:

```tsx
// Example of the expected combination pattern
import { Dimensions, Platform, StyleSheet, View, Text } from 'react-native';

const { width } = Dimensions.get('window');

export function ProductCard({ isFeatured }) {
  return (
    <View
      className="p-4 rounded-xl bg-white border border-gray-200"
      style={[styles.dynamicCard, isFeatured && styles.platformShadow]}
    >
      <Text className="text-lg font-bold text-gray-900">Product Title</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dynamicCard: {
    width: (width - 48) / 2, // Runtime layout math
  },
  platformShadow: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1 },
      android: { elevation: 3 }
    })
  }
});
```

**4. Refactoring Instructions**
If you see existing code using inline object styles or massive `StyleSheet` blocks for simple flex containers, margins, or text styles, automatically refactor them to Tailwind CSS `className` utilities.

---

## 14. Design Inspiration to Look At

For general email-list interaction patterns (swipe actions, card density, urgency signaling), Superhuman and Spark are the strongest reference points. For the calm, minimal aesthetic and micro-animation restraint, look at Linear and Arc. For chat interface patterns with visible tool-call confirmations, look at how modern AI assistant apps show "did an action" versus "just replied." Searching these names on Mobbin will surface current, real screenshots to compare against as the screens get built.

---

## 15. What's Deliberately Left Out of Version One

Worth stating clearly so nobody accidentally scope-creeps this: no Slack integration yet, no automatic learning loop from the `feedback` table (it's collected, but nothing acts on it automatically yet), no team/shared-inbox support (every connected inbox belongs to exactly one person), no in-app email composer (replying deep-links out to Gmail itself for now).

---

## 16. Implementation Roadmap

This section defines the exact build order. Each phase must be fully complete (backend + frontend) before moving to the next. No skipping ahead.

### What's Already Built

| Area | Status | Details |
|------|--------|---------|
| **Auth flow** | ✅ Complete | Sign-up, sign-in, OTP verification, Google/Apple OAuth, unverified sign-up detection |
| **Onboarding slides** | ✅ Complete | Welcome screen, 3-slide carousel, animation, SecureStore persistence |
| **Design system** | ✅ Complete | 90+ color tokens, urgency system, Manrope fonts, HeroUI Native integration |
| **Convex schema** | ✅ Complete | 9 tables: users, connectedInboxes, messages, classifications, feedback, preferences, digests, conversations, chatMessages, subscriptions |
| **Convex functions** | ✅ Complete | Queries + mutations for all 9 tables (users, connectedInboxes, messages, classifications, preferences, digests, conversations, chatMessages, subscriptions) |
| **Clerk webhook** | ✅ Complete + verified | `convex/http.ts` `/clerk-webhook`, `users.upsertFromClerk` / `users.deleteFromClerk` internal mutations. Verified: fresh sign-up creates a `users` row + default `preferences` |
| **Bottom tabs + header** | ✅ Complete | 4-tab bar (Inbox/Digest/Chat/Settings), `AppHeader` with back button |
| **App shell** | ✅ Complete | Root layout, ClerkProvider, ConvexProviderWithClerk, theme provider, route guards |
| **Backend architecture** | ✅ Complete | Layered `entries → service → repository` for all domains; `AppError` no-op patterns, `DbReader`/`DbWriter` confined to repositories; shipped on branch `refactor/layered-backend` |
| **Frontend state & resilience** | ✅ Complete | Error boundary + retry, offline detection, skeleton loaders, canonical empty/error/loading states, custom pull-to-refresh, independent parallel data fetching |
| **Priority Inbox Home (feed UI)** | ✅ Complete | Redesigned Inbox/Digest/Chat/Settings screens + headers; filter chips with live urgency counts; message cards; empty/loading/error states; Gmail OAuth connect wired |
| **Gmail connect (native-first OAuth)** | ✅ Complete + tested on device | Native system account sheet via `expo-google-credential-auth` (Android Credential Manager / iOS GoogleSignIn) + in-app-browser fallback; backend token exchange, encrypted token storage, refresh-token self-heal on re-grant, disconnect that revokes on Google's side; `oauth-complete` deep-link route |

---

### Phase 1: App Shell — Webhook, Bottom Tabs, Reusable Header

**Goal:** User is signed up, and after sign-in lands on the main tab bar. Clerk user records are stored in Convex via webhook. Stack screens have a reusable header with a back button.

**Frontend routes:**

| Route | Purpose |
|-------|---------|
| `app/(tabs)/_layout.tsx` | Bottom tab bar: Inbox, Digest, Chat, Settings |
| `app/(tabs)/index.tsx` | Inbox home — priority feed, filter chips, states (Connect Gmail empty state present; OAuth wiring lands in Phase 2) |
| `app/(tabs)/digest.tsx` | Digest placeholder |
| `app/(tabs)/chat.tsx` | Chat placeholder |
| `app/(tabs)/settings.tsx` | Settings placeholder |
| `components/app-header.tsx` | Reusable header: title + optional back button for stack screens |
| `hooks/use-current-user.ts` | Gates `isLoading` until the webhook has stored the user |

**Backend needed:**
- `convex/http.ts` — Clerk webhook endpoint `/clerk-webhook` (svix signature verified) — ✅ built
- `users.upsertFromClerk` / `users.deleteFromClerk` internal mutations — ✅ built
- `users.get` already acts as `current` (returns user or null) — ✅ built

**Dashboard configuration (DONE):**
1. ✅ **Clerk dashboard → Webhooks** — endpoint `https://fine-snake-179.convex.site/clerk-webhook`, `user` events.
2. ✅ **Convex dashboard → Environment variables** — `CLERK_WEBHOOK_SECRET` set.
3. ✅ Backend deployed via `npx convex dev`.

**Completion criteria:**
- ✅ Signing up creates a row in the `users` table (verified in Convex dashboard)
- [ ] Signed-in user lands on the bottom tab bar with 4 tabs
- [ ] Tab switching works, active tab tinted with brand color
- [ ] Header renders a back chevron on stack screens, calls `router.back()`

---

### Phase 2 — Foundations: Frontend State & Resilience System

**Goal:** Before any real data flows, the app needs a resilient shell so every screen renders a clear loading / empty / error state, detects when the device drops offline, and supports a premium pull-to-refresh. This was built up front (before Gmail OAuth) so Phase 2's real screens land on top of infrastructure instead of improvising states.

**Completed components:**

| Component | Purpose |
|-----------|---------|
| `ErrorBoundary` + `ErrorState` | Wraps each pager page; friendly fallback with "Try again" that remounts the page |
| `AsyncView` | Declarative `loading / error / empty / data` renderer for any screen |
| `EmptyState` | Vector-icon + soft-tint-circle state (brand/success/urgent/warning/muted tones) for "Connect inbox", "All caught up", etc. |
| `ScreenSkeleton` | Shimmer skeletons (feed / digest / settings / generic) built on HeroUI `Skeleton` — never a blank screen |
| `useNetworkStatus` + `OfflineBanner` | `expo-network` reachability; slim animated banner under the pager header when offline |
| `RefreshableList` | Custom premium pull-to-refresh: drawn arc + spin (reanimated + svg) on iOS, branded native `RefreshControl` on Android |
| `useQueryState` | Thin wrapper over Convex object-form `useQuery` that surfaces `loading / error / data` so screens never hang silently |
| `useCurrentUser`, user profile, grouped settings | Settings screen with account card, grouped rows, sign-out |

**How the Inbox screen is wired (all queries run in parallel, no waterfalls):**
- `connectedInboxes.list` → gates "Connect your inbox" empty state
- `messages.getCounts` → live counts on filter chips (Urgent · N, Today · N, Later · N)
- `messages.getPriorityFeed` → paginated message feed (infinite scroll via `usePaginatedQuery`), sorted by AI urgency
- `messages.markRead` → tapping an unread card marks it read (haptic feedback)
- Digest tab reads `digests.getToday`; Settings reads `subscriptions.get` for the plan row

**Side-quest fixed:** `messages.getPriorityFeed` / `search` returned `EMPTY_PAGE` with `as const` (a `readonly` page) which broke `usePaginatedQuery` — typed it as `PaginationResult<FeedItem>` so pagination typing matches.

> Note: pull-to-refresh currently re-pulls the reactive feed (data arrives via Convex reactivity). A "true" re-sync gesture that triggers a Gmail sync action ships with the sync work in Phase 2.

---

### Phase 2: Connect Inbox (Gmail OAuth) + Priority Inbox Feed

**Goal:** User connects their first Gmail inbox directly from the Inbox tab when it's empty, then sees their email feed sorted by AI urgency. **Frontend foundation above is built, and Gmail OAuth connect is fully working** — remaining work is the sync action that pulls real messages into the `messages` table and the classification pipeline that scores them.

**What was built for OAuth connect (now complete):**

| Area | Files | Status |
|------|-------|--------|
| **Native auth client** | `expo-google-credential-auth@0.2.0` installed in `apps/native` | ✅ Android Credential Manager + iOS GoogleSignIn SDK |
| **Native connect hook** | `apps/native/features/inbox/use-connect-inbox.ts` | ✅ Auto-retry on refresh-token suppression; toasts for feedback |
| **Backend token exchange** | `packages/backend/convex/gmail/entries.ts` (`completeNativeConnect`) | ✅ Native path (no `redirect_uri`) + browser path (`/api/gmail/callback`) |
| **Token storage** | `packages/backend/convex/gmail/oauth.ts` (WebCrypto AES-GCM encrypt/decrypt) | ✅ Encrypted with `GOOGLE_TOKEN_ENCRYPTION_KEY` |
| **Refresh-token self-heal** | `gmail/oauth.ts` `completeNativeConnect` + `gmail/internal.ts` `getConnectedInboxByEmail` | ✅ Detects suppressed refresh token → revokes stale grant → auto-retry |
| **Disconnect with revocation** | `gmail/oauth.ts` `disconnectAndRevoke` action → decrypt + Google revoke endpoint + cascade delete | ✅ Tested on device |
| **Deep-link return route** | `apps/native/app/oauth-complete.tsx` + registered in `_layout.tsx` | ✅ Handles browser-flow redirect with auto-navigation |
| **Env wiring** | `EXPO_PUBLIC_GOOGLE_CLIENT_ID` in `apps/native/.env` + `packages/env/src/native.ts` | ✅ Shared web client ID for native AuthorizationClient |

**Backend still needed:**
- Gmail sync action — needs building (pulls new messages per inbox using `history.list`)
- `messages.insert` action — needs building (batch insert synced messages)
- `messages.getPriorityFeed` — already built
- `messages.get` — already built
- `messages.getCounts` — already built
- `messages.markHandled` — already built
- `messages.snooze` — already built
- `messages.markRead` — already built
- `feedback.upsert` mutation — needs building (for "Not Important" action)

**Completion criteria:**
- ✅ Inbox tab shows "Connect Gmail" empty state when no inbox is connected
- ✅ User taps "Connect Gmail" → Google account picker opens (native system sheet on Android/iOS, browser fallback on web)
- ✅ User grants permission → tokens stored in `connectedInboxes` (encrypted)
- ✅ Disconnect button revokes tokens on Google's side and clears local rows
- ✅ Gmail sync action — needs building
- Inbox shows messages sorted by urgency (waiting on sync)
- Filter chips filter by urgency level (built, needs real data)
- Swipe right marks handled, swipe left opens snooze sheet (built)
- Tap opens message detail with AI summary (built)

---

### Phase 3: Message Actions & Feedback

**Goal:** User can interact with messages (mark handled, snooze, feedback).

**Frontend route:** Built into Phase 2 screens

| Screen | Route | Components | Description |
|--------|-------|------------|-------------|
| Snooze Sheet | Bottom sheet on `(inbox)/index.tsx` | `ActionSheet` | Snooze 1h, 3h, tomorrow, mark handled, archive |
| Feedback Toast | Toast on `(inbox)/[messageId].tsx` | Toast via `useToast` | "Got it, we'll learn from this" confirmation |

**Reusable components to build:**

| Component | Built from | Purpose |
|-----------|-----------|---------|
| `ActionSheet` | HeroUI `Sheet` | Snooze options, mark handled, archive |

**Backend needed:**
- `messages.markHandled` — already built
- `messages.snooze` — already built
- `feedback.upsert` — needs building
- `classifications.upsert` — already built (for AI to use)

**Completion criteria:**
- Snooze sheet shows with time options
- Mark handled removes card with animation
- "Not Important" shows toast and records feedback

---

### Phase 4: Walkthrough Overlay

**Goal:** First-time users see a guided tour of the inbox.

**Frontend route:** State layered on `(inbox)/index.tsx`

| Screen | Route | Components | Description |
|--------|-------|------------|-------------|
| Walkthrough Overlay | State on `(inbox)/index.tsx` | `WalkthroughStep`, `SpotlightCutout`, `ProgressDots` | Dark overlay with spotlight on UI elements |

**Reusable components to build:**

| Component | Built from | Purpose |
|-----------|-----------|---------|
| `WalkthroughOverlay` | `Modal` + Reanimated | Dark overlay with cut-out spotlight |
| `WalkthroughStep` | HeroUI `Card` + `Button` | Callout bubble with copy, Next/Done button |

**Backend needed:**
- None (client-side state, persisted to SecureStore)

**Completion criteria:**
- 4-step walkthrough on first inbox visit
- Spotlight highlights: filter chips, message card, swipe gesture, detail tap
- Skip button at every step
- Persists "completed" flag to SecureStore

---

### Phase 5: Daily Digest

**Goal:** User sees a daily plain-English summary of important emails.

**Frontend route:** `app/(digest)/` (tab)

| Screen | Route | Components | Description |
|--------|-------|------------|-------------|
| Digest Home | `(digest)/index.tsx` | `DigestDateHeader`, `DigestLines`, `PlayButton` | Date, 3-5 urgency-colored lines, play button |
| Digest Playback | State on `(digest)/index.tsx` | `WaveformBars`, `HighlightLine`, `PlaybackControls` | Audio playback with karaoke-style highlighting |

**Reusable components to build:**

| Component | Built from | Purpose |
|-----------|-----------|---------|
| `DigestLine` | HeroUI `Text` + urgency dot | Single digest sentence with colored dot |
| `WaveformBars` | Reanimated views | 4 vertical bars animating in wave pattern |
| `PlaybackControls` | HeroUI `Button` | Play/pause, skip, voice label |

**Backend needed:**
- `digests.getToday` — already built
- `digests.upsert` — already built
- `digests.markAudioGenerated` — already built
- Digest generation action (calls AI) — needs building
- Text-to-speech action (device voice) — needs building

**Completion criteria:**
- Digest shows today's summary lines
- Play button starts audio playback
- Current line highlights during playback
- Voice character label tappable

---

### Phase 6: Settings & Preferences

**Goal:** User can manage their account, inboxes, and preferences.

**Frontend route:** `app/(settings)/` (tab)

| Screen | Route | Components | Description |
|--------|-------|------------|-------------|
| Settings Home | `(settings)/index.tsx` | `SettingsGroup`, `SettingsRow` | Grouped list: Account, Inboxes, Notifications, Personalization, Subscription |
| Connected Inboxes | `(settings)/inboxes.tsx` | `InboxRow`, `AddInboxButton` | List of connected inboxes with status, add/remove |
| VIP Senders | `(settings)/vip.tsx` | `VipList`, `AddVipInput` | List of VIP emails, add/remove |
| Category Rules | `(settings)/categories.tsx` | `CategoryToggle` | Toggle muted categories |
| Notification Prefs | `(settings)/notifications.tsx` | `TimePicker`, `QuietHoursToggle` | Digest time, quiet hours |
| Voice Character Picker | `(settings)/voice.tsx` | `VoicePicker` | List of voices with preview, locked state |
| Profile | `(settings)/profile.tsx` | `ProfileCard` | Name, email, avatar (uses Clerk UserProfileView) |
| Subscription | `(settings)/subscription.tsx` | `PlanCard`, `PaywallSheet` | Current plan, upgrade button |

**Reusable components to build:**

| Component | Built from | Purpose |
|-----------|-----------|---------|
| `SettingsGroup` | Section list wrapper | Grouped rows with header |
| `SettingsRow` | HeroUI `ListItem` | Label + value + chevron |
| `PaywallSheet` | HeroUI `Sheet` | Feature-specific upgrade prompt |
| `VoicePicker` | Custom list | Voice cards with preview, lock state |
| `VipList` | FlatList + swipe | VIP emails with remove |

**Backend needed:**
- `preferences.get` — already built
- `preferences.update` — already built
- `preferences.addVip` — already built
- `preferences.removeVip` — already built
- `preferences.addMutedCategory` — already built
- `preferences.removeMutedCategory` — already built
- `connectedInboxes.list` — already built
- `connectedInboxes.rename` — already built
- `connectedInboxes.remove` — already built
- `users.get` — already built
- `users.update` — already built
- `subscriptions.get` — already built

**Completion criteria:**
- Settings shows all groups with correct data
- Connected inboxes list shows status, add/remove works
- VIP list add/remove works
- Category toggles work
- Notification preferences save
- Voice picker shows locked/unlocked states
- Profile shows user info
- Subscription shows plan status

---

### Phase 7: Subscription & Paywall Gating

**Goal:** Free/Pro features are gated correctly.

**Frontend route:** Built into existing screens + `PaywallSheet`

| Screen | Route | Components | Description |
|--------|-------|------------|-------------|
| Paywall Sheet | Bottom sheet everywhere | `PaywallSheet` | Feature-specific upgrade prompt |
| Usage Limit Banner | Inline in `(inbox)/index.tsx` | `UsageLimitBanner` | "Daily limit reached" banner |

**Reusable components to build:**

| Component | Built from | Purpose |
|-----------|-----------|---------|
| `PaywallSheet` | HeroUI `Sheet` | Specific to triggering feature, shows benefits + price |
| `UsageLimitBanner` | Custom banner | Inline, not popup, when limit hit |

**Backend needed:**
- `subscriptions.upsert` — already built
- RevenueCat webhook handler action — needs building
- RevenueCat SDK integration — needs building
- `subscriptions.get` — already built

**Completion criteria:**
- Free user sees paywall when tapping locked features
- Pro user has full access
- Usage banner appears when daily limit hit
- Subscription status syncs via webhook

---

### Phase 8: Notifications

**Goal:** User receives push notifications for urgent emails.

**Frontend route:** None (background service)

| Screen | Route | Components | Description |
|--------|-------|------------|-------------|
| (No new screens) | — | — | Notifications handled by background actions |

**Backend needed:**
- Push notification action — needs building
- Quiet hours check logic — needs building
- Token registration mutation — needs building

**Completion criteria:**
- Urgent emails trigger push notifications
- Quiet hours suppress notifications
- Notification opens app to message detail

---

### Phase 9: Chat / Voice Agent

**Goal:** User can chat with an AI about their inbox.

**Frontend route:** `app/(chat)/` (tab)

| Screen | Route | Components | Description |
|--------|-------|------------|-------------|
| Chat Home | `(chat)/index.tsx` | `ChatThread`, `ChatInput`, `ExamplePrompts` | Chat thread, text input with mic, example prompt chips |
| Voice Input | State on `(chat)/index.tsx` | `ListeningIndicator`, `PulseCircle` | Active listening state with pulsing circle |

**Reusable components to build:**

| Component | Built from | Purpose |
|-----------|-----------|---------|
| `ChatBubble` | HeroUI `Card` | User (right, brand) / Assistant (left, surface) bubbles |
| `ActionChip` | HeroUI `Chip` | Shows action taken: "Snoozed 4 emails" |
| `ChatInput` | HeroUI `Input` + mic icon | Text input with send/mic toggle |
| `ExamplePrompts` | Horizontal chips | "What's urgent today?", "Any job offers?" |
| `ListeningIndicator` | Reanimated circle | Pulsing circle during voice input |

**Backend needed:**
- `conversations.create` — already built
- `conversations.list` — already built
- `chatMessages.create` — already built
- `chatMessages.list` — already built
- Chat agent action (calls LLM with tools) — needs building
- Speech-to-text action — needs building
- Text-to-speech action (for voice replies) — needs building

**Completion criteria:**
- Chat thread shows messages with correct alignment
- Text input sends message, AI responds
- Action chips show when AI performs actions
- Voice input works (speak → text → AI responds)
- Example prompts show on empty state
- Pro-only: free user sees paywall

---

### Phase 10: Background Sync & Cron Jobs

**Goal:** Inboxes sync automatically, digests generate on schedule.

**Frontend route:** None (background services)

| Screen | Route | Components | Description |
|--------|-------|------------|-------------|
| (No new screens) | — | — | All background work via Convex crons |

**Backend needed:**
- Recurring inbox check cron — needs building
- Daily digest generation cron — needs building
- Permission refresh cron — needs building
- Token refresh action — needs building

**Completion criteria:**
- Inboxes sync every few minutes
- Digest generates at user's preferred time
- Permissions refresh before expiry
- Broken inboxes show status in settings

---

### Build Order Summary

```
Phase 1:  App Shell — Clerk webhook, bottom tabs, reusable header   ✅ done
Phase 2:  Connect Inbox (Gmail OAuth) + Priority Inbox Feed         ← YOU ARE HERE
            Frontend foundation (states, skeleton, offline,
            pull-to-refresh, redesigned screens)                    ✅ done
            Gmail OAuth connect (native-first + browser fallback)   ✅ done
            + disconnect w/ Google-side revocation, self-heal
            Gmail sync + classification pipeline                    [ next ]
Phase 3:  Message Actions & Feedback
Phase 4:  Walkthrough Overlay
Phase 5:  Daily Digest
Phase 6:  Settings & Preferences
Phase 7:  Subscription & Paywall Gating
Phase 8:  Notifications
Phase 9:  Chat / Voice Agent
Phase 10: Background Sync & Cron Jobs
```

**Rule:** Do not start Phase N+1 until Phase N is fully working end-to-end (backend deployed, frontend wired, tested on device).
