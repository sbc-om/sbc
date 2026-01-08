import * as React from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "link";
type ButtonSize = "xs" | "sm" | "md" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap select-none outline-none transition disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-white/20 dark:focus-visible:ring-offset-black";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 active:bg-zinc-900/90 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:active:bg-white/90",
  secondary:
    "border border-(--surface-border) bg-(--surface) text-foreground shadow-sm hover:bg-white/70 dark:hover:bg-white/5",
  ghost:
    "bg-transparent text-(--muted-foreground) hover:bg-black/5 hover:text-foreground dark:hover:bg-white/7",
  destructive:
    "bg-red-600 text-white shadow-sm hover:bg-red-500 active:bg-red-600/90 focus-visible:ring-red-300 dark:focus-visible:ring-red-400/40",
  link: "bg-transparent text-foreground underline-offset-4 hover:underline",
};

const sizes: Record<ButtonSize, string> = {
  xs: "h-8 px-2.5 text-xs",
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
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
