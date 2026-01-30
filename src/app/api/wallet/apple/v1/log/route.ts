export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (process.env.NODE_ENV === "development") {
      console.log("[AppleWallet] log:", JSON.stringify(body));
    }
  } catch {
    // ignore
  }

  return new Response("", { status: 200 });
}
