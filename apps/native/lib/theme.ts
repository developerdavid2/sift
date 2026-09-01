import { useThemeColor } from "heroui-native";
import { useMemo } from "react";

const COLOR_TOKENS = [
  // base
  ["background", "background"],
  ["background-secondary", "backgroundSecondary"],
  ["background-tertiary", "backgroundTertiary"],
  ["background-inverse", "backgroundInverse"],
  ["foreground", "foreground"],

  // surfaces
  ["surface", "surface"],
  ["surface-foreground", "surfaceForeground"],
  ["surface-secondary", "surfaceSecondary"],
  ["surface-secondary-foreground", "surfaceSecondaryForeground"],
  ["surface-tertiary", "surfaceTertiary"],
  ["surface-tertiary-foreground", "surfaceTertiaryForeground"],

  // overlay
  ["overlay", "overlay"],
  ["overlay-foreground", "overlayForeground"],
  ["backdrop", "backdrop"],

  // neutrals
  ["muted", "muted"],
  ["default", "default"],
  ["default-foreground", "defaultForeground"],
  ["default-hover", "defaultHover"],
  ["default-pressed", "defaultPressed"],

  // accent / brand (brand-primary is a pure alias of accent in global.css,
  // both included since both are used across the app)
  ["accent", "accent"],
  ["accent-foreground", "accentForeground"],
  ["accent-hover", "accentHover"],
  ["accent-pressed", "accentPressed"],
  ["accent-soft", "accentSoft"],
  ["accent-soft-foreground", "accentSoftForeground"],
  ["accent-soft-hover", "accentSoftHover"],
  ["brand-primary", "brandPrimary"],
  ["brand-primary-foreground", "brandPrimaryForeground"],
  ["brand-primary-hover", "brandPrimaryHover"],
  ["brand-primary-pressed", "brandPrimaryPressed"],
  ["brand-primary-soft", "brandPrimarySoft"],
  ["brand-primary-soft-foreground", "brandPrimarySoftForeground"],

  // form fields
  ["field", "field"],
  ["field-foreground", "fieldForeground"],
  ["field-placeholder", "fieldPlaceholder"],
  ["field-border", "fieldBorder"],

  // status
  ["success", "success"],
  ["success-foreground", "successForeground"],
  ["success-hover", "successHover"],
  ["success-pressed", "successPressed"],
  ["success-soft", "successSoft"],
  ["success-soft-foreground", "successSoftForeground"],
  ["success-soft-hover", "successSoftHover"],
  ["warning", "warning"],
  ["warning-foreground", "warningForeground"],
  ["warning-hover", "warningHover"],
  ["warning-pressed", "warningPressed"],
  ["warning-soft", "warningSoft"],
  ["warning-soft-foreground", "warningSoftForeground"],
  ["warning-soft-hover", "warningSoftHover"],
  ["danger", "danger"],
  ["danger-foreground", "dangerForeground"],
  ["danger-hover", "dangerHover"],
  ["danger-pressed", "dangerPressed"],
  ["danger-soft", "dangerSoft"],
  ["danger-soft-foreground", "dangerSoftForeground"],
  ["danger-soft-hover", "dangerSoftHover"],

  // structure
  ["segment", "segment"],
  ["segment-foreground", "segmentForeground"],
  ["border", "border"],
  ["border-secondary", "borderSecondary"],
  ["border-tertiary", "borderTertiary"],
  ["separator", "separator"],
  ["separator-secondary", "separatorSecondary"],
  ["separator-tertiary", "separatorTertiary"],
  ["focus", "focus"],
  ["link", "link"],

  // Sift: urgency system
  ["urgent", "urgent"],
  ["urgent-foreground", "urgentForeground"],
  ["urgent-hover", "urgentHover"],
  ["urgent-pressed", "urgentPressed"],
  ["urgent-soft", "urgentSoft"],
  ["today", "today"],
  ["today-foreground", "todayForeground"],
  ["today-hover", "todayHover"],
  ["today-pressed", "todayPressed"],
  ["today-soft", "todaySoft"],
  ["later", "later"],
  ["later-foreground", "laterForeground"],
  ["later-hover", "laterHover"],
  ["later-pressed", "laterPressed"],
  ["later-soft", "laterSoft"],
] as const satisfies readonly (readonly [string, string])[];

type ColorEntry = (typeof COLOR_TOKENS)[number];
type CamelKey = ColorEntry[1];

export type ThemeColors = Record<CamelKey, string>;

const KEBAB_KEYS = COLOR_TOKENS.map(([kebab]) => kebab);

function useThemeColorAny(keys: readonly string[]): string[] {
  const fn = useThemeColor as unknown as (keys: readonly string[]) => string[];
  return fn(keys);
}

export function useThemeColors(): ThemeColors {
  const values = useThemeColorAny(KEBAB_KEYS);

  return useMemo(() => {
    const entries = COLOR_TOKENS.map(
      ([, camelKey], index) => [camelKey, values[index]] as const,
    );
    return Object.fromEntries(entries) as ThemeColors;
  }, values);
}
