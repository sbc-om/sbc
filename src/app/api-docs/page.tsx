'use client';

import { useEffect, useRef } from 'react';
import ApiDocsWrapper from '@/components/ApiDocsWrapper';
import 'swagger-ui-react/swagger-ui.css';

export default function SwaggerUIPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Custom styling for Swagger UI to better match our design system
    const style = document.createElement('style');
    style.textContent = `
      .swagger-ui {
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        color: #0f172a;
      }
      .swagger-ui .topbar {
        display: none;
      }
      .swagger-ui a {
        color: #2563eb;
      }
      .swagger-ui .info {
        margin: 16px 0 24px;
      }
      .swagger-ui .scheme-container {
        padding: 12px 0;
        background: transparent;
        box-shadow: none;
      }
      .swagger-ui .opblock {
        border-radius: 14px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
      }
      .swagger-ui .opblock-summary {
        border-radius: 14px;
      }
      .swagger-ui .opblock .opblock-summary-method {
        border-radius: 10px;
        font-weight: 600;
      }
      .swagger-ui .opblock-section-header {
        background: #f8fafc;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
      }
      .swagger-ui .model-box,
      .swagger-ui .models,
      .swagger-ui .model-container {
        border-radius: 14px;
      }
      .swagger-ui .tab li {
        border-radius: 8px;
      }
      .swagger-ui .btn,
      .swagger-ui .btn.authorize {
        border-radius: 10px;
        box-shadow: none;
      }
      .swagger-ui .btn.execute {
        background: #0f172a;
        border-color: #0f172a;
        color: #fff;
      }
      .swagger-ui .btn.execute:hover {
        background: #1e293b;
      }
      .swagger-ui input[type="text"],
      .swagger-ui input[type="email"],
      .swagger-ui input[type="password"],
      .swagger-ui textarea {
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        box-shadow: none;
      }
      .swagger-ui select {
        border-radius: 10px;
        border: 1px solid #e2e8f0;
      }
      .swagger-ui .response-col_status {
        font-weight: 600;
      }

      .dark .swagger-ui {
        color: #e2e8f0;
      }
      .dark .swagger-ui a {
        color: #60a5fa;
      }
      .dark .swagger-ui .opblock {
        border-color: #1f2937;
        box-shadow: 0 6px 20px rgba(2, 6, 23, 0.35);
        background: #0b1220;
      }
      .dark .swagger-ui .opblock-section-header {
        background: #0f172a;
        border-color: #1f2937;
      }
      .dark .swagger-ui .btn.execute {
        background: #38bdf8;
        border-color: #38bdf8;
        color: #0b1220;
      }
      .dark .swagger-ui input[type="text"],
      .dark .swagger-ui input[type="email"],
      .dark .swagger-ui input[type="password"],
      .dark .swagger-ui textarea,
      .dark .swagger-ui select {
        background: #0b1220;
        border-color: #1f2937;
        color: #e2e8f0;
      }
      .dark .swagger-ui .tab li {
        background: #0b1220;
        border-color: #1f2937;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
    >
      <div className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_45%)] dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_45%)]" />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-slate-300">
              API Docs • v1
            </span>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              SBC API Documentation
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Professional documentation for the Smart Business Card platform. This page includes
              request samples, parameters, response codes, and data models.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-900">OAuth 2.0 Ready</span>
              <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-900">Rate Limits</span>
              <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-900">Webhooks</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <aside className="sticky top-6 h-fit rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/60">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Guide
          </div>
          <nav className="mt-4 space-y-2 text-sm">
            <a
              href="#overview"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span>Overview</span>
              <span className="text-xs text-slate-400">01</span>
            </a>
            <a
              href="#authentication"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span>Authentication</span>
              <span className="text-xs text-slate-400">02</span>
            </a>
            <a
              href="#best-practices"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span>Best Practices</span>
              <span className="text-xs text-slate-400">03</span>
            </a>
            <a
              href="#reference"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span>API Reference</span>
              <span className="text-xs text-slate-400">04</span>
            </a>
          </nav>
          <div className="mt-6 rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-3 text-xs text-slate-600 dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-slate-300">
            If you have questions, contact support or use the chat section.
          </div>
        </aside>

        <main className="space-y-8">
          <section
            id="overview"
            className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/60"
          >
            <h2 className="text-lg font-semibold">Overview</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
              SBC APIs follow a RESTful design and standard JSON responses. For better performance,
              responses include metadata fields and support filtering, search, and pagination.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-slate-200">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Base URL</div>
                <div className="mt-1 font-mono text-xs">/api</div>
              </div>
              <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-slate-200">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Response</div>
                <div className="mt-1 text-xs">JSON UTF-8</div>
              </div>
            </div>
          </section>

          <section
            id="authentication"
            className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/60"
          >
            <h2 className="text-lg font-semibold">Authentication</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Use JWT tokens to access protected routes. Send the token in the Authorization header as
              <span className="mx-1 rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                Bearer &lt;token&gt;
              </span>
              .
            </p>
            <div className="mt-4 rounded-xl border border-slate-200/70 bg-slate-50 p-4 text-xs text-slate-700 dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-slate-200">
              Note: Tokens expire. Use refresh routes to renew them.
            </div>
          </section>

          <section
            id="best-practices"
            className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/60"
          >
            <h2 className="text-lg font-semibold">Best Practices</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
              <li>Use filters and pagination for heavy requests.</li>
              <li>Check HTTP status codes and handle errors properly.</li>
              <li>For better security, avoid storing tokens on the client.</li>
            </ul>
          </section>

          <section
            id="reference"
            className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/60"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">API Reference</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Search, filter, and test requests directly from this section.
                </p>
              </div>
              <div className="rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                Live Playground
              </div>
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
          </section>
        </main>
      </div>
    </div>
  );
}
