"use client";

import React, { createContext, useContext } from "react";
import type { Locale } from "./locales";
import type { Dictionary } from "./getDictionary";

type DictionaryContextValue = {
  locale: Locale;
  dict: Dictionary;
};

const DictionaryContext = createContext<DictionaryContextValue | null>(null);

export function DictionaryProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <DictionaryContext.Provider value={{ locale, dict }}>
      {children}
    </DictionaryContext.Provider>
  );
}

export function useDictionary() {
  const value = useContext(DictionaryContext);
  if (!value) {
    throw new Error("useDictionary must be used within DictionaryProvider");
  }
  return value;
}
