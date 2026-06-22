"use client";

import Link from "next/link";
import { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";

type UIButtonVariant = "primary" | "secondary" | "floating";
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

const variantClasses: Record<UIButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  floating: "btn-floating",
};

const sizeClasses: Record<UIButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
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
      className={cx("btn-ui", sizeClasses[size], variantClasses[variant], className)}
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
      className={cx("btn-ui", sizeClasses[size], variantClasses[variant], className)}
      {...props}
    >
      {children}
    </Link>
  );
}