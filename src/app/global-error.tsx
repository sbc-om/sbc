"use client";

import { useEffect, useState } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error("[SBC] Global error:", error);
  }, [error]);

  return (
    <html lang="en" dir="ltr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error | Smart Business Center</title>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          :root {
            --accent: #0079f4;
            --accent-2: #06b6d4;
            --bg: #f4f6f9;
            --surface: #ffffff;
            --fg: #0f172a;
            --muted: #64748b;
            --border: rgba(15,23,42,0.08);
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --bg: #121212;
              --surface: #1e1e1e;
              --fg: #e8eaed;
              --muted: #94a3b8;
              --border: rgba(255,255,255,0.08);
            }
          }
          body {
            font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
            background: var(--bg);
            color: var(--fg);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-font-smoothing: antialiased;
          }
          .error-container {
            width: min(92vw, 480px);
            text-align: center;
            padding: 2rem;
          }
          .error-card {
            background: var(--surface);
            border-radius: 1rem;
            padding: 2.5rem 2rem;
            position: relative;
            overflow: hidden;
          }
          .error-card::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--accent), var(--accent-2));
          }
          .error-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 1.25rem;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(0,121,244,0.1), rgba(6,182,212,0.1));
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .error-icon svg {
            width: 28px;
            height: 28px;
            color: var(--accent);
          }
          .error-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 14px;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            background: rgba(239,68,68,0.1);
            color: #ef4444;
            margin-bottom: 1rem;
          }
          .error-badge::before {
            content: "";
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #ef4444;
            animation: pulse-dot 2s ease-in-out infinite;
          }
          @keyframes pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.8); }
          }
          h1 {
            font-size: 1.5rem;
            font-weight: 800;
            letter-spacing: -0.02em;
            margin-bottom: 0.5rem;
          }
          .error-desc {
            font-size: 0.875rem;
            line-height: 1.6;
            color: var(--muted);
            margin-bottom: 1.5rem;
          }
          .btn-row {
            display: flex;
            gap: 0.75rem;
            justify-content: center;
            flex-wrap: wrap;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.625rem 1.5rem;
            border-radius: 0.75rem;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: transform 0.15s, opacity 0.15s;
            text-decoration: none;
          }
          .btn:hover { opacity: 0.9; }
          .btn:active { transform: scale(0.97); }
          .btn-primary {
            background: linear-gradient(135deg, var(--accent), var(--accent-2));
            color: #fff;
          }
          .btn-secondary {
            background: var(--surface);
            color: var(--fg);
            border: 1px solid var(--border);
          }
          .error-details-toggle {
            display: block;
            margin: 1rem auto 0;
            background: none;
            border: none;
            color: var(--muted);
            font-size: 0.75rem;
            cursor: pointer;
            text-decoration: underline;
            text-underline-offset: 2px;
          }
          .error-details {
            margin-top: 0.75rem;
            padding: 0.75rem;
            border-radius: 0.5rem;
            background: rgba(0,0,0,0.03);
            text-align: start;
            font-family: ui-monospace, monospace;
            font-size: 0.7rem;
            color: var(--muted);
            word-break: break-word;
            max-height: 120px;
            overflow-y: auto;
            line-height: 1.5;
          }
          @media (prefers-color-scheme: dark) {
            .error-details { background: rgba(255,255,255,0.04); }
          }
          .footer-text {
            margin-top: 1.5rem;
            font-size: 0.75rem;
            color: var(--muted);
          }
        `}</style>
      </head>
      <body>
        <div className="error-container">
          <div className="error-card">
            <div className="error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <div className="error-badge">Application Error</div>

            <h1>Something went wrong</h1>
            <p className="error-desc">
              An unexpected error occurred while loading the page. Our team has
              been notified. Please try again or return to the homepage.
            </p>

            <div className="btn-row">
              <button className="btn btn-primary" onClick={() => reset()}>
                Try Again
              </button>
              <a className="btn btn-secondary" href="/">
                Go Home
              </a>
            </div>

            {error?.message && (
              <>
                <button
                  className="error-details-toggle"
                  onClick={() => setShowDetails((v) => !v)}
                >
                  {showDetails ? "Hide details" : "Show details"}
                </button>
                {showDetails && (
                  <div className="error-details">
                    {error.digest && <div>Digest: {error.digest}</div>}
                    <div>{error.message}</div>
                  </div>
                )}
              </>
            )}
          </div>

          <p className="footer-text">&copy; {new Date().getFullYear()} Smart Business Center</p>
        </div>
      </body>
    </html>
  );
}
