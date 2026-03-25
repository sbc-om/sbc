import * as React from "react";

import { cn } from "@/lib/cn";

const base =
  "min-h-28 w-full rounded-xl bg-(--chip-bg) px-4 py-3 text-sm text-foreground outline-none placeholder:text-(--muted-foreground) backdrop-blur transition focus:ring-2 focus:ring-(--accent)/30";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return <textarea ref={ref} className={cn(base, className)} {...props} />;
  },
);

Textarea.displayName = "Textarea";
