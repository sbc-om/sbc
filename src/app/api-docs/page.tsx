'use client';

import { useEffect, useRef } from 'react';
import ApiDocsWrapper from '@/components/ApiDocsWrapper';
import 'swagger-ui-react/swagger-ui.css';

export default function SwaggerUIPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Custom styling for dark mode support
    const style = document.createElement('style');
    style.textContent = `
      .swagger-ui {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .swagger-ui .topbar {
        display: none;
      }
      @media (prefers-color-scheme: dark) {
        .swagger-ui {
          filter: invert(88%) hue-rotate(180deg);
        }
        .swagger-ui .microlight {
          filter: invert(100%) hue-rotate(180deg);
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">SBC API Documentation</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete API reference for the Smart Business Card platform
          </p>
        </div>
        
        <ApiDocsWrapper 
          url="/api/docs"
          docExpansion="list"
          defaultModelsExpandDepth={1}
          defaultModelExpandDepth={1}
          displayRequestDuration={true}
          filter={true}
          showExtensions={true}
          showCommonExtensions={true}
          tryItOutEnabled={true}
        />
      </div>
    </div>
  );
}
