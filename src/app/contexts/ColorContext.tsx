"use client";

import React, { createContext, useContext, useMemo, ReactNode, useState, useInsertionEffect } from "react";
import { useBranchConfig } from "@/app/configs";
import {
  resolveColors,
  generateColorCSSVariables,
  generateColorRGBVariables,
  ResolvedColors,
} from "@/app/utils/colorUtils";

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

  // useInsertionEffect runs BEFORE the browser paints, before useEffect
  // This ensures colors are applied before any visual updates
  useInsertionEffect(() => {
    const root = document.documentElement;
    const cssVariables = generateColorCSSVariables(colors);
    const rgbVariables = generateColorRGBVariables(colors);

    Object.entries({ ...cssVariables, ...rgbVariables }).forEach(
      ([key, value]) => {
        root.style.setProperty(key, value);
      }
    );
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

