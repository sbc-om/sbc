export const runtime = "nodejs";

export async function POST(req: Request) {
  // PassKit can send logs here. We accept and ignore (or you can wire to your logger).
  const text = await req.text().catch(() => "");
  if (process.env.NODE_ENV !== "production" && text) {
    console.log("[apple-wallet][log]", text.slice(0, 2000));
  }
  return new Response(null, { status: 200 });
}
