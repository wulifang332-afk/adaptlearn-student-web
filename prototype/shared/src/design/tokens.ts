export const DESIGN_TOKENS = {
  color: {
    surface: "#F7F8FA",
    surfaceRaised: "#FFFFFF",
    text: "#1F2933",
    textMuted: "#5B6472",
    border: "#D8DEE8",
    focus: "#2563EB",
    success: "#1F8A5B",
    warning: "#B7791F",
    review: "#9A5B00",
    block: "#B42318",
    info: "#2563EB",
    studentAccent: "#2F7D6D",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    chip: 999,
    control: 6,
    card: 8,
    drawer: 8,
  },
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    adminBasePx: 14,
    studentBasePx: 16,
    lineHeight: 1.45,
    letterSpacing: 0,
  },
  elevation: {
    raised: "0 1px 2px rgba(31, 41, 51, 0.08)",
    modal: "0 12px 32px rgba(31, 41, 51, 0.18)",
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
