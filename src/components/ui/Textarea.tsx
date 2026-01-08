import * as React from "react";

import { cn } from "@/lib/cn";

const base =
  "min-h-28 w-full rounded-xl border border-(--surface-border) bg-white/70 px-4 py-3 text-sm text-foreground shadow-sm outline-none placeholder:text-zinc-500 backdrop-blur transition focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-black/30 dark:placeholder:text-zinc-500 dark:focus-visible:ring-white/20 dark:focus-visible:ring-offset-black";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return <textarea ref={ref} className={cn(base, className)} {...props} />;
  },
);

Textarea.displayName = "Textarea";
