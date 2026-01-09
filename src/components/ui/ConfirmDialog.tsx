"use client";

import { useState } from "react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  variant?: "destructive" | "primary";
  trigger: React.ReactNode;
}

export function ConfirmDialog({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  variant = "destructive",
  trigger,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <div className="sbc-card p-6 m-4">
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-(--muted-foreground)">{message}</p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  {cancelText}
                </Button>
                <Button
                  variant={variant}
                  size="sm"
                  onClick={() => {
                    onConfirm();
                    setOpen(false);
                  }}
                >
                  {confirmText}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
