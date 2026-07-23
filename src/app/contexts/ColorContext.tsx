"use client";

import React, { createContext, useContext, useMemo, useEffect, ReactNode } from "react";
import { useBranchConfig } from "@/app/configs";
import {
  resolveColors,
  ResolvedColors,
} from "@/app/utils/colorUtils";
import { generateColorStyleTag } from "@/app/utils/theme";

interface ColorContextType {
  colors: ResolvedColors;
  isReady: boolean;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export function ColorProvider({ children }: { children: ReactNode }) {
  const branchConfig = useBranchConfig();

  // Memoize colors to prevent unnecessary recalculations
  const colors = useMemo(() => {
    return resolveColors(branchConfig.colors);
  }, [
    branchConfig.colors?.primary,
    branchConfig.colors?.secondary,
    branchConfig.colors?.accent,
    branchConfig.colors?.tertiary,
    branchConfig.colors?.quaternary,
    branchConfig.colors?.textLight,
    branchConfig.colors?.textDark,
    branchConfig.colors?.gradientStart,
    branchConfig.colors?.gradientEnd,
    branchConfig.colors?.success,
  ]);

  // Inject client-side style tag to override SSR colors on every SPA navigation.
  // This ensures colors are always correct even after client-side route changes.
  useEffect(() => {
    const styleId = "theme-variables-client";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = generateColorStyleTag(colors);
  }, [colors]);

  return (
    <ColorContext.Provider value={{ colors, isReady: true }}>
      {children}
    </ColorContext.Provider>
  );
}

/**
 * Hook to access resolved colors throughout the application
 */
export function useColors(): ResolvedColors {
  const context = useContext(ColorContext);
  if (!context) {
    throw new Error("useColors must be used within ColorProvider");
  }
  return context.colors;
}

/**
 * Hook to check if colors are ready
 */
export function useColorsReady(): boolean {
  const context = useContext(ColorContext);
  if (!context) {
    throw new Error("useColorsReady must be used within ColorProvider");
  }
  return context.isReady;
}