"use client";

import { create } from "zustand";

import type { ExecutionStep } from "@/lib/ai/agentflow/types";

type ChatMessage = {
  id: string;
  role: "user" | "agent";
  text: string;
};

type ChatState = {
  isOpen: boolean;
  isRunning: boolean;
  messages: ChatMessage[];
  steps: ExecutionStep[];
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  addUserMessage: (text: string) => void;
  addAgentMessage: (text: string) => void;
  setRunning: (running: boolean) => void;
  setSteps: (steps: ExecutionStep[]) => void;
  clear: () => void;
};

export const useAgentChatStore = create<ChatState>((set) => ({
  isOpen: false,
  isRunning: false,
  messages: [],
  steps: [],

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (open) => set({ isOpen: open }),

  addUserMessage: (text) =>
    set((state) => ({
      messages: [...state.messages, { id: crypto.randomUUID(), role: "user", text }],
    })),

  addAgentMessage: (text) =>
    set((state) => ({
      messages: [...state.messages, { id: crypto.randomUUID(), role: "agent", text }],
    })),

  setRunning: (running) => set({ isRunning: running }),
  setSteps: (steps) => set({ steps }),

  clear: () =>
    set({
      isRunning: false,
      messages: [],
      steps: [],
    }),
}));
