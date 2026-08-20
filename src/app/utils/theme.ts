import { getBranchConfig } from "@/app/configs";
import { resolveColors, DEFAULT_COLORS, ResolvedColors } from "./colorUtils";

/**
 * Gets resolved colors for a given country, SSR-safe
 * This runs on the server, so no flash of wrong colors
 */
export function getResolvedColors(): ResolvedColors {
  return resolveColors(getBranchConfig().colors);
}

/**
 * Generates CSS variable declarations as a style string for SSR injection
 */
export function generateColorStyleTag(colors: ResolvedColors): string {
  const vars = [
    `--color-primary: ${colors.primary};`,
    `--color-secondary: ${colors.secondary};`,
    `--color-accent: ${colors.accent};`,
    `--color-tertiary: ${colors.tertiary};`,
    `--color-quaternary: ${colors.quaternary};`,
    `--color-text-light: ${colors.textLight};`,
    `--color-text-dark: ${colors.textDark};`,
    `--color-gradient-start: ${colors.gradientStart};`,
    `--color-gradient-end: ${colors.gradientEnd};`,
    `--color-success: ${colors.success};`,
  ].join("\n");

  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "0, 0, 0";
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  };

  const rgbVars = [
    `--color-primary-rgb: ${hexToRgb(colors.primary)};`,
    `--color-secondary-rgb: ${hexToRgb(colors.secondary)};`,
    `--color-accent-rgb: ${hexToRgb(colors.accent)};`,
    `--color-tertiary-rgb: ${hexToRgb(colors.tertiary)};`,
    `--color-quaternary-rgb: ${hexToRgb(colors.quaternary)};`,
    `--color-gradient-start-rgb: ${hexToRgb(colors.gradientStart)};`,
    `--color-gradient-end-rgb: ${hexToRgb(colors.gradientEnd)};`,
    `--color-success-rgb: ${hexToRgb(colors.success)};`,
  ].join("\n");

  return `:root {\n${vars}\n${rgbVars}\n}`;
}

/**
 * Returns just the CSS variable declarations for all colors
 * Used to generate inline style tags in layout.tsx
 */
export function getThemeStyleTag(): string {
  const colors = getResolvedColors();
  return generateColorStyleTag(colors);
}

export { DEFAULT_COLORS };
export type { ResolvedColors };
