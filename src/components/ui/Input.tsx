import * as React from "react";

import { cn } from "@/lib/cn";

const base =
  "h-11 w-full rounded-xl border border-(--surface-border) bg-(--surface) px-4 text-sm text-foreground shadow-[var(--shadow)] outline-none placeholder:text-(--muted-foreground) backdrop-blur transition focus-visible:border-[color:var(--accent)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)]";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return <input ref={ref} type={type} className={cn(base, className)} {...props} />;
  },
);

Input.displayName = "Input";
