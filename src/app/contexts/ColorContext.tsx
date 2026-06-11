"use client";

import React, { createContext, useContext, useEffect, useMemo, ReactNode } from "react";
import { useBranchConfig } from "@/app/configs";
import {
  resolveColors,
  generateColorCSSVariables,
  generateColorRGBVariables,
  ResolvedColors,
} from "@/app/utils/colorUtils";

interface ColorContextType {
  colors: ResolvedColors;
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

  useEffect(() => {
    // Apply colors as CSS variables on the root element
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
    <ColorContext.Provider value={{ colors }}>
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

