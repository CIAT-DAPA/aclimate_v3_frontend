"use client";

import { ReactNode } from "react";
import { useColorsReady } from "@/app/contexts/ColorContext";

interface ColorReadyWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component that waits for colors to be ready before rendering children
 * This prevents the flash of incorrect colors on initial page load
 */
export function ColorReadyWrapper({ children }: ColorReadyWrapperProps) {
  const isReady = useColorsReady();

  // Don't render children until colors are ready
  // This prevents hydration mismatch and color flash
  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
