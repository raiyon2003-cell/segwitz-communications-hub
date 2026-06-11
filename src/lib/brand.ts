/**
 * CONTEG / SegWitz brand guidelines — official palette & typography
 * @see Brand Guideline PDF
 */
export const BRAND_COLORS = {
  /** Light Lime Green (Viridian) — primary actions, highlights */
  lightLimeGreen: "#588157",
  /** Muted Olive Green — secondary text, subtle UI */
  mutedOliveGreen: "#819171",
  /** Charcoal Green / Night Forest — headings, dark backgrounds */
  charcoalGreen: "#344e41",
  /** Deep Teal Blue — dark surfaces, auth panels */
  deepTealBlue: "#073b4c",
  /** Steel Teal — accents, links, interactive highlights */
  steelTeal: "#28666e",
  /** Platinum — light mode page background */
  platinum: "#ebeee8",
  /** Night Forest — dark mode page background */
  nightForest: "#344e41",
} as const;

export const BRAND_FONTS = {
  primary: "Source Sans 3",
  weights: {
    regular: 400,
    semibold: 600,
  },
} as const;

export const BRAND_RADIUS = {
  sm: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
} as const;

/** Chart series — brand palette only */
export const CHART_COLORS = [
  BRAND_COLORS.lightLimeGreen,
  BRAND_COLORS.steelTeal,
  BRAND_COLORS.mutedOliveGreen,
  BRAND_COLORS.charcoalGreen,
  BRAND_COLORS.deepTealBlue,
] as const;

/** Status / semantic mapping */
export const STATUS_COLORS = {
  success: BRAND_COLORS.lightLimeGreen,
  warning: "#a16207",
  error: "#b91c1c",
  info: BRAND_COLORS.steelTeal,
  pending: BRAND_COLORS.mutedOliveGreen,
} as const;
