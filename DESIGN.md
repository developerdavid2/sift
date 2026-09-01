# Sift — Design System Reference

This is the living design reference for building Sift screens. It is the single source of truth for tokens, type, spacing, components, and motion. The product spec lives in [README.md](./README.md) (§5–§6) — this doc turns that spec into concrete, reference-able values and component definitions.

When building or reshaping UI: **derive everything from these tokens.** No raw hex. Every color, radius, and shadow must come from the token set so light/dark theming and future variants stay consistent.

---

## 1. Visual Direction (the "why")

One sentence: **calm, flat, and quietly confident** — a deep ink background on dark, near-white on light, one restrained **indigo** brand accent, and a disciplined urgency system that does the talking.

- **Calm over loud.** No gradients, no glassmorphism without purpose, no floating-widget clutter. Surfaces are separated by spacing first, shadow only where something is genuinely "liftable" (cards, sheets).
- **The urgency dot is the signature.** The single most distinctive, repeated element is the small colored urgency dot + label (README 5.6). It carries the emotional load — red for urgent, amber for today, gray for later — with a slow pulse reserved only for the highest-confidence urgent items.
- **Not always simple; always clean.** Richer, layered screens are allowed, provided hierarchy and whitespace stay disciplined.

---

## 2. Color Tokens

**One source of truth.** Every color value is defined once as a raw CSS variable in `global.css` under `@layer theme { @variant light/dark }`, then bridged two ways:

- **Tailwind utilities** — `@theme inline static` maps raw vars → `--color-*`, generating `bg-background`, `text-urgent`, `border-border`, etc.
- **Runtime hook** — `useThemeColors()` in `lib/theme.ts` reads the same `--color-*` vars via uniwind's `useCSSVariable`, re-resolving on theme toggle.

So a color used in a component is **never written in TS or as raw hex** — it comes from the CSS token set via either `className` or `useThemeColors()`. Change the raw var in `global.css` → both update automatically.

```tsx
// Tailwind path
<View className="bg-brand-primary" />

// StyleSheet path
const colors = useThemeColors();
StyleSheet.create({ box: { backgroundColor: colors.brandPrimary } })
```

> **Derived tints** (hover, soft, pressed) are computed in CSS (`color-mix`) and are **Tailwind-only** — use `bg-accent-soft`, `bg-brand-primary-pressed`, etc. They are not exposed through `useThemeColors()` (native `color-mix` can't resolve to JS).

### Base (light)

| Token         | Utility                | Value   |
| ------------- | ---------------------- | ------- |
| background    | `bg-background`        | `#FAFAFA` |
| foreground    | `text-foreground`      | `#1A1A2E` |
| surface       | `bg-surface`           | `#FFFFFF` |
| surface-2     | `bg-surface-secondary` | `#F5F5F5` |
| surface-3     | `bg-surface-tertiary`  | `#EFEFEF` |
| muted         | `text-muted`           | `#6B7280` |
| border        | `border-border`        | `#E5E5EA` |

### Base (dark)

| Token         | Utility                | Value   |
| ------------- | ---------------------- | ------- |
| background    | `bg-background`        | `#0F0F1A` |
| foreground    | `text-foreground`      | `#F5F5F7` |
| surface       | `bg-surface`           | `#1A1A2E` |
| surface-2     | `bg-surface-secondary` | `#22223A` |
| surface-3     | `bg-surface-tertiary`  | `#2A2A42` |
| muted         | `text-muted`           | `#A1A1AA` |
| border        | `border-border`        | `#2E2E45` |

> Dark background is a **deep blue-black ink** (`#0F0F1A`), not pure black and not a warm gray — this is the README's "solid deep background" and the app's signature first impression.

### Brand (accent)

`accent` is the mapped Sift brand primary — **indigo**, not teal (the README is explicit). It's the button/active-state/link color.

| Token                     | Utility                    | Light             | Dark            |
| ------------------------- | -------------------------- | ----------------- | --------------- |
| brand-primary             | `bg-brand-primary`         | `#4F46E5`         | `#6366F1`       |
| brand-pressed             | (button pressed state)     | `#4338CA`         | `#818CF8`       |
| brand-primary-foreground  | `text-brand-primary-foreground` | `#FFFFFF`   | `#FFFFFF`       |
| brand-primary-hover       | `bg-brand-primary-hover`   | mix               | mix             |
| brand-primary-soft        | `bg-brand-primary-soft`    | 14% tint          | 14% tint        |

`brand-primary-soft` is the low-opacity brand tint used behind icon tiles (README 5.3) and the message summary card (README 5.8) — use it via `bg-brand-primary-soft`.

### Urgency system (signature)

Used by the dot + label on email cards and the AI reason line.

| Level  | Utility          | Dot color         | Text on dot |
| ------ | ---------------- | ----------------- | ----------- |
| urgent | `bg-urgent`      | `#EF4444` (red)   | white       |
| today  | `bg-today`       | `#F59E0B` (amber) | dark ink    |
| later  | `bg-later`       | `#9CA3AF` (gray)  | white       |

Each has a matching `-soft` background variant for chips/badges and a `-foreground` for label text.

### Status

`success`, `warning`, `danger` exist (heroui-native) and are used for system states (LIVE/OFFLINE etc.). The **urgency** set above is separate and used for message triage.

| Token     | Light     | Dark      |
| --------- | --------- | --------- |
| success   | `#10B981` | `#34D399` |
| warning   | `#F59E0B` | `#FBBF24` |
| danger    | `#EF4444` | `#F87171` |

---

## 3. Radius

Derived from base `--radius` (`0.5rem`). Used consistently — larger radii only for floating/sheet surfaces.

| Scale | Value  | Usage                        |
| ----- | ------ | ---------------------------- |
| sm    | 4px    | small icons, inline chips    |
| md    | 6px    | inputs, compact controls     |
| lg    | 8px    | buttons, standard            |
| xl    | 12px   | cards, icon tiles            |
| 2xl   | 16px   | message cards                |
| 3xl   | 24px   | sheets (snooze/paywall)      |

---

## 4. Shadows & Elevation

- **At rest, cards are flat** — separated by spacing, not shadow (README 5.6). Long lists stay light.
- **`shadow-sm`** — used only where something is "liftable": floating cards, the connect-inbox card (README 5.4).
- **Sheets** (snooze, paywall) and overlays use `--overlay-shadow` for lift off the backdrop.
- **No shadow in dark mode** (felts flat and calm).

---

## 5. Motion Language

Restrained, purposeful. Spring physics for anything that moves into place; fades for anything that appears.

| Motion            | Spec                                                    |
| ----------------- | ------------------------------------------------------- |
| Card swipe (mark) | slides off right with a spring; green check flashes     |
| Sheet rise        | spring on entry; drag-to-dismiss                        |
| List reveal       | staggered ~100ms fade-up, one at a time                 |
| Urgent pulse      | scale 1.0 → 1.08 → 1.0, ~2s loop, ONLY when score ≥ 9   |
| Progress ring     | spring fill (small overshoot), not linear               |
| Status text       | crossfade, never hard-cut                               |

Reduce-motion: honor system setting; pulse and spring become fades/instant where required.

---

## 6. Reusable Components (README §6)

Built on heroui-native primitives, styled with the tokens above. Each listed with its props and key states.

| Component           | Built from        | Props                                                                 | Notes                                                            |
| ------------------- | ----------------- | --------------------------------------------------------------------- | --------------------------------------------------------------- |
| `PriorityBadge`     | heroUI `Chip`     | `level` (urgent/today/later), `pulsing` (bool)                        | Dot + label; pulse only when urgent & score ≥ 9                  |
| `EmailCard`         | heroUI `Card`     | `sender`, `subject`, `reason`, `level`, `isRead`, `onSwipeRight`, `onSwipeLeft` | Core list item; radius 2xl; subject bold if unread        |
| `ActionSheet`       | heroUI `Sheet`    | `options[]`, `onSelect`, `onCancel`                                   | Reused for snooze/archive choices                               |
| `PaywallSheet`      | heroUI `Sheet`    | `featureName`, `benefits[]`, `price`, `onUpgrade`                     | Always specific to the triggering feature                         |
| `EmptyState`        | Custom + `Text`   | `icon`, `title`, `subtitle`, `action?`                                | "All caught up", "no results", "no inboxes"                      |
| `VoicePicker`       | `ListItem` list   | `voices[]`, `selectedId`, `locked`, `onSelect`, `onPreview`           | Locked swaps play for lock icon                                   |
| `InboxSourcePicker` | horizontal `ScrollView` of avatars | `accounts[]`, `selectedId`, `onSelect`              | Only renders when >1 inbox                                        |
| `ChatBubble`        | heroUI `Card`     | `role` (user/assistant), `text`, `actionChip?`                        | Action chip only when a tool call actually ran                    |
| `UsageLimitBanner`  | inline banner     | `message`, `ctaLabel`, `onPress`                                      | Inline in feed, never a popup                                     |

---

## 7. Screen Principles (reference for art direction)

- **First screen is clean & calm** — one focal point, 1–3 short lines, one clear action. No chip/pill/badge overload on first view (imagegen skill §12).
- **No box-in-box clutter** — prefer fewer, clearer containers; one strong structural move over many small ones.
- **Text stays readable** — generous size and spacing; never shrink copy to fit more UI (imagegen §29).
- **Safe areas respected** — content never crammed into status/home-indicator regions.
- **Anti-generic guardrails** — no purple-blue gradients, no glassmorphism embellishment, no fake dashboard widget spam. Linking voice = calm + indigo accent + urgency dot system.

---

## 8. When to Revisit This Document

This doc is meant to be updated as features land and real screens are built. Update it when:
- A new semantic color/shadow/radius is needed and added to `global.css`.
- A new reusable component is created that other features will share.
- A motion behavior is finalized beyond the scaffold.
- Generated screen concepts (imagegen skill) reveal a better concrete expression of the tokens.
