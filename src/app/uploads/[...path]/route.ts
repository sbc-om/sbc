import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const target = `/media/${path.join("/")}`;
  return NextResponse.redirect(new URL(target, req.url), 308);
}

export async function HEAD(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const res = await GET(req, ctx);
  return new Response(null, { status: res.status, headers: res.headers });
}
