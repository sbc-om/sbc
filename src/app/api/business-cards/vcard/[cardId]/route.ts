import { getBusinessCardById } from "@/lib/db/businessCards";
import { getBusinessById } from "@/lib/db/businesses";

export const runtime = "nodejs";

function escapeVcard(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;

  const card = getBusinessCardById(cardId);
  if (!card || !card.isPublic || !card.isApproved) {
    return new Response("Not found", { status: 404 });
  }

  const business = getBusinessById(card.businessId);
  const businessName = business?.name?.en ?? business?.name?.ar ?? "SBC";

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVcard(card.fullName)}`,
    `N:${escapeVcard(card.fullName)};;;;`,
    `ORG:${escapeVcard(businessName)}`,
  ];

  if (card.title) lines.push(`TITLE:${escapeVcard(card.title)}`);
  if (card.phone) lines.push(`TEL;TYPE=WORK,VOICE:${escapeVcard(card.phone)}`);
  if (card.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVcard(card.email)}`);
  if (card.website) lines.push(`URL:${escapeVcard(card.website)}`);
  if (card.bio) lines.push(`NOTE:${escapeVcard(card.bio)}`);

  lines.push("END:VCARD");

  const vcard = lines.join("\n");

  return new Response(vcard, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename=business-card-${encodeURIComponent(card.id)}.vcf`,
      "Cache-Control": "no-store",
    },
  });
}
