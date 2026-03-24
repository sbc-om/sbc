import * as React from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "link";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap select-none outline-none transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-60 disabled:saturate-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[color:var(--accent)] text-[color:var(--accent-foreground)]",
  secondary:
    "bg-(--surface) text-foreground",
  ghost:
    "bg-transparent text-(--muted-foreground) hover:bg-(--chip-bg) hover:text-foreground",
  destructive: "bg-red-600 text-white hover:bg-red-500 active:bg-red-600/90",
  link: "bg-transparent text-foreground underline-offset-4 hover:underline",
};

const sizes: Record<ButtonSize, string> = {
  xs: "h-8 px-2.5 text-xs",
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-6 text-base font-semibold",
  icon: "h-9 w-9 rounded-full",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={buttonVariants({ variant, size, className })}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
