import * as React from "react";

import { cn } from "@/lib/cn";

const base =
  "h-11 w-full rounded-xl border border-(--surface-border) bg-white/70 px-4 text-sm text-foreground shadow-sm outline-none placeholder:text-zinc-500 backdrop-blur transition focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-black/30 dark:placeholder:text-zinc-500 dark:focus-visible:ring-white/20 dark:focus-visible:ring-offset-black";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return <input ref={ref} type={type} className={cn(base, className)} {...props} />;
  },
);

Input.displayName = "Input";
