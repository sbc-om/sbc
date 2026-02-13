"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import type SwaggerUIReact from "swagger-ui-react";

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsWrapper(props: React.ComponentProps<typeof SwaggerUIReact>) {
  useEffect(() => {
    // Suppress the UNSAFE_componentWillReceiveProps warning from swagger-ui-react
    // This is a known issue with the library (v5.31.0) that we cannot fix directly.
    // The library uses deprecated React lifecycle methods in the ModelCollapse component.
    // See: https://github.com/swagger-api/swagger-ui/issues/9615
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: unknown[]) => {
      if (
        typeof args[0] === "string" &&
        (args[0].includes("UNSAFE_componentWillReceiveProps") ||
          args[0].includes("ModelCollapse"))
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    console.warn = (...args: unknown[]) => {
      if (
        typeof args[0] === "string" &&
        (args[0].includes("UNSAFE_componentWillReceiveProps") ||
          args[0].includes("ModelCollapse"))
      ) {
        return;
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return <SwaggerUI {...props} />;
}
