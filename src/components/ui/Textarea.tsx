import * as React from "react";

import { cn } from "@/lib/cn";

const base =
  "min-h-28 w-full rounded-xl border border-(--surface-border) bg-(--surface) px-4 py-3 text-sm text-foreground shadow-[var(--shadow)] outline-none placeholder:text-(--muted-foreground) backdrop-blur transition focus:border-[color:var(--accent)]";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return <textarea ref={ref} className={cn(base, className)} {...props} />;
  },
);

Textarea.displayName = "Textarea";
