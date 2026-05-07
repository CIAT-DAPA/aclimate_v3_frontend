"use client";

import Link from "next/link";
import { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";

type UIButtonVariant = "primary" | "secondary";
type UIButtonSize = "sm" | "md" | "lg";

interface UIButtonBaseProps {
  variant?: UIButtonVariant;
  size?: UIButtonSize;
  className?: string;
  children: ReactNode;
}

interface UIButtonProps
  extends UIButtonBaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> {}

interface UIButtonLinkProps
  extends UIButtonBaseProps,
    Omit<ComponentProps<typeof Link>, "className" | "children"> {}

const baseClasses =
  "inline-flex items-center justify-center gap-2 border font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#bc6c25]/40 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg";

const sizeClasses: Record<UIButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const variantClasses: Record<UIButtonVariant, string> = {
  primary:
    "bg-[#bc6c25] border-[#bc6c25] text-[#fefae0] hover:bg-[#a85a1f] hover:border-[#a85a1f]",
  secondary:
    "bg-white border-[#bc6c25] text-[#bc6c25] hover:bg-[#f8f3ee] hover:text-[#a85a1f]",
};

const cx = (...values: Array<string | undefined>) =>
  values.filter(Boolean).join(" ");

export function UIButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: UIButtonProps) {
  return (
    <button
      className={cx(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function UIButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...props
}: UIButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cx(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
