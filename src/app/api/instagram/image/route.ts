import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function buildPlaceholderSvg(label?: string): string {
  const safeLabel = (label || "Instagram")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 48);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="${safeLabel}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#1f2937"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <g fill="#9ca3af" font-family="Arial, sans-serif" text-anchor="middle">
    <text x="400" y="380" font-size="42" font-weight="700">Instagram</text>
    <text x="400" y="430" font-size="24">${safeLabel || "Post preview"}</text>
  </g>
</svg>`;
}

function normalizeRemoteUrl(input: string): string {
  return input
    .trim()
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/");
}

function isAllowedInstagramHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "instagram.com" ||
    host.endsWith(".instagram.com") ||
    host === "cdninstagram.com" ||
    host.endsWith(".cdninstagram.com") ||
    host === "fbcdn.net" ||
    host.endsWith(".fbcdn.net")
  );
}

export async function GET(req: NextRequest) {
  try {
    const raw = String(req.nextUrl.searchParams.get("url") || "");
    const label = String(req.nextUrl.searchParams.get("label") || "").trim();
    if (!raw) {
      const svg = buildPlaceholderSvg(label || "No image");
      return new NextResponse(svg, {
        status: 200,
        headers: {
          "content-type": "image/svg+xml; charset=utf-8",
          "cache-control": "private, max-age=300",
        },
      });
    }

    const normalized = normalizeRemoteUrl(raw);
    let target: URL;

    try {
      target = new URL(normalized);
    } catch {
      const svg = buildPlaceholderSvg(label || "Invalid image");
      return new NextResponse(svg, {
        status: 200,
        headers: {
          "content-type": "image/svg+xml; charset=utf-8",
          "cache-control": "private, max-age=300",
        },
      });
    }

    if (!["http:", "https:"].includes(target.protocol) || !isAllowedInstagramHost(target.hostname)) {
      const svg = buildPlaceholderSvg(label || "Blocked image");
      return new NextResponse(svg, {
        status: 200,
        headers: {
          "content-type": "image/svg+xml; charset=utf-8",
          "cache-control": "private, max-age=300",
        },
      });
    }

    const upstream = await fetch(target.toString(), {
      headers: {
        "user-agent": "Mozilla/5.0",
        accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        referer: "https://www.instagram.com/",
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      const svg = buildPlaceholderSvg(label || "Preview unavailable");
      return new NextResponse(svg, {
        status: 200,
        headers: {
          "content-type": "image/svg+xml; charset=utf-8",
          "cache-control": "private, max-age=180",
        },
      });
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await upstream.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("[instagram-image] GET error:", error);
    const svg = buildPlaceholderSvg("Preview unavailable");
    return new NextResponse(svg, {
      status: 200,
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "private, max-age=180",
      },
    });
  }
}
