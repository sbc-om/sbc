"use client";

import { useEffect, useState } from "react";

type TypewriterTextProps = {
  text: string;
  speedMs?: number;
};

export function TypewriterText({ text, speedMs = 75 }: TypewriterTextProps) {
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    setVisibleText("");

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisibleText(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, speedMs);

    return () => window.clearInterval(timer);
  }, [text, speedMs]);

  return <>{visibleText}</>;
}
