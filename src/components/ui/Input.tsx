import * as React from "react";

import { cn } from "@/lib/cn";

const base =
  "h-12 w-full rounded-xl px-4 text-base text-foreground outline-none backdrop-blur transition-all focus:ring-2 focus:ring-accent/50";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", style, ...props }, ref) => {
    return (
      <input 
        ref={ref} 
        type={type} 
        className={cn(base, className)} 
        style={{
          border: "2px solid",
          borderColor: "var(--surface-border)",
          backgroundColor: "var(--background)",
          ...style
        }}
        {...props} 
      />
    );
  },
);

Input.displayName = "Input";
