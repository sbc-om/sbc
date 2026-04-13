"use client";

import { useMemo, useState } from "react";

import { Button } from "./Button";
import { Input } from "./Input";
import { Textarea } from "./Textarea";

type DialogVariant = "primary" | "destructive";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
};

type PromptOptions = ConfirmOptions & {
  placeholder?: string;
  initialValue?: string;
  multiline?: boolean;
  validate?: (value: string) => string | null | undefined;
};

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type PromptState = PromptOptions & {
  resolve: (value: string | null) => void;
};

export function useModalDialogs() {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [promptState, setPromptState] = useState<PromptState | null>(null);
  const [promptValue, setPromptValue] = useState("");
  const [promptError, setPromptError] = useState<string | null>(null);

  const confirm = (options: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      setConfirmState({
        confirmText: "Confirm",
        cancelText: "Cancel",
        variant: "primary",
        ...options,
        resolve,
      });
    });

  const prompt = (options: PromptOptions) =>
    new Promise<string | null>((resolve) => {
      setPromptValue(options.initialValue ?? "");
      setPromptError(null);
      setPromptState({
        confirmText: "Save",
        cancelText: "Cancel",
        variant: "primary",
        ...options,
        resolve,
      });
    });

  const closeConfirm = (value: boolean) => {
    confirmState?.resolve(value);
    setConfirmState(null);
  };

  const closePrompt = (value: string | null) => {
    promptState?.resolve(value);
    setPromptState(null);
    setPromptValue("");
    setPromptError(null);
  };

  const submitPrompt = () => {
    if (!promptState) return;

    const validationError = promptState.validate?.(promptValue);
    if (validationError) {
      setPromptError(validationError);
      return;
    }

    closePrompt(promptValue);
  };

  const dialog = useMemo(
    () => (
      <>
        {confirmState ? (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
              onClick={() => closeConfirm(false)}
            />
            <div
              className="relative z-[101] w-full max-w-md overflow-hidden rounded-[28px] border border-(--surface-border) bg-(--card) shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
            >
              <div className="bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] px-6 py-5">
                <h3 id="confirm-dialog-title" className="text-lg font-semibold text-foreground">
                  {confirmState.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-(--muted-foreground)">
                  {confirmState.message}
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-(--surface-border) px-6 py-4">
                <Button variant="ghost" size="sm" onClick={() => closeConfirm(false)}>
                  {confirmState.cancelText}
                </Button>
                <Button
                  variant={confirmState.variant}
                  size="sm"
                  onClick={() => closeConfirm(true)}
                >
                  {confirmState.confirmText}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {promptState ? (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
              onClick={() => closePrompt(null)}
            />
            <form
              className="relative z-[101] w-full max-w-2xl overflow-hidden rounded-[28px] border border-(--surface-border) bg-(--card) shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
              onSubmit={(event) => {
                event.preventDefault();
                submitPrompt();
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="prompt-dialog-title"
            >
              <div className="bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] px-6 py-5">
                <h3 id="prompt-dialog-title" className="text-lg font-semibold text-foreground">
                  {promptState.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-(--muted-foreground)">
                  {promptState.message}
                </p>
              </div>
              <div className="px-6 py-5">
                {promptState.multiline ? (
                  <Textarea
                    autoFocus
                    rows={10}
                    value={promptValue}
                    placeholder={promptState.placeholder}
                    onChange={(event) => setPromptValue(event.target.value)}
                    className="min-h-52 bg-(--surface)"
                  />
                ) : (
                  <Input
                    autoFocus
                    value={promptValue}
                    placeholder={promptState.placeholder}
                    onChange={(event) => setPromptValue(event.target.value)}
                    className="bg-(--surface)"
                  />
                )}
                {promptError ? (
                  <p className="mt-3 text-sm text-red-500">{promptError}</p>
                ) : null}
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-(--surface-border) px-6 py-4">
                <Button variant="ghost" size="sm" onClick={() => closePrompt(null)}>
                  {promptState.cancelText}
                </Button>
                <Button variant={promptState.variant} size="sm" type="submit">
                  {promptState.confirmText}
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </>
    ),
    [confirmState, promptError, promptState, promptValue],
  );

  return { confirm, prompt, dialog };
}