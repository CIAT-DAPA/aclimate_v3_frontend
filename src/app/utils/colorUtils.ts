/**
 * Default color scheme used when colors are not specified in the branch config
 */
export const DEFAULT_COLORS = {
  primary: "#bc6c25",
  secondary: "#dda15e",
  accent: "#fefae0",
  tertiary: "#8B4513",
  quaternary: "#D2B48C",
  textLight: "#171717",
  textDark: "#ffffff",
  gradientStart: "#bc6c25",
  gradientEnd: "#dda15e",
  success: "#16A34A",
};

/**
 * Interface for resolved colors with all properties guaranteed
 */
export interface ResolvedColors {
  primary: string;
  secondary: string;
  accent: string;
  tertiary: string;
  quaternary: string;
  textLight: string;
  textDark: string;
  gradientStart: string;
  gradientEnd: string;
  success: string;
}

/**
 * Resolves colors from branch config, applying defaults for any missing values
 */
export const resolveColors = (
  configColors?: Partial<{
    primary?: string;
    secondary?: string;
    accent?: string;
    tertiary?: string;
    quaternary?: string;
    textLight?: string;
    textDark?: string;
    gradientStart?: string;
    gradientEnd?: string;
    success?: string;
  }>
): ResolvedColors => {
  return {
    primary: configColors?.primary ?? DEFAULT_COLORS.primary,
    secondary: configColors?.secondary ?? DEFAULT_COLORS.secondary,
    accent: configColors?.accent ?? DEFAULT_COLORS.accent,
    tertiary: configColors?.tertiary ?? DEFAULT_COLORS.tertiary,
    quaternary: configColors?.quaternary ?? DEFAULT_COLORS.quaternary,
    textLight: configColors?.textLight ?? DEFAULT_COLORS.textLight,
    textDark: configColors?.textDark ?? DEFAULT_COLORS.textDark,
    gradientStart: configColors?.gradientStart ?? DEFAULT_COLORS.gradientStart,
    gradientEnd: configColors?.gradientEnd ?? DEFAULT_COLORS.gradientEnd,
    success: configColors?.success ?? DEFAULT_COLORS.success,
  };
};

/**
 * Generates CSS variable declarations from resolved colors
 * Used to dynamically set CSS variables based on branch configuration
 */
export const generateColorCSSVariables = (
  colors: ResolvedColors
): Record<string, string> => {
  return {
    "--color-primary": colors.primary,
    "--color-secondary": colors.secondary,
    "--color-accent": colors.accent,
    "--color-tertiary": colors.tertiary,
    "--color-quaternary": colors.quaternary,
    "--color-text-light": colors.textLight,
    "--color-text-dark": colors.textDark,
    "--color-gradient-start": colors.gradientStart,
    "--color-gradient-end": colors.gradientEnd,
    "--color-success": colors.success,
  };
};

/**
 * Converts hex color to RGB format
 * Useful for semi-transparent color overlays
 */
export const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0, 0, 0";
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `${r}, ${g}, ${b}`;
};

/**
 * Generates CSS variables with RGB values for use in rgba() functions
 */
export const generateColorRGBVariables = (
  colors: ResolvedColors
): Record<string, string> => {
  return {
    "--color-primary-rgb": hexToRgb(colors.primary),
    "--color-secondary-rgb": hexToRgb(colors.secondary),
    "--color-accent-rgb": hexToRgb(colors.accent),
    "--color-tertiary-rgb": hexToRgb(colors.tertiary),
    "--color-quaternary-rgb": hexToRgb(colors.quaternary),
    "--color-gradient-start-rgb": hexToRgb(colors.gradientStart),
    "--color-gradient-end-rgb": hexToRgb(colors.gradientEnd),
    "--color-success-rgb": hexToRgb(colors.success),
  };
};
