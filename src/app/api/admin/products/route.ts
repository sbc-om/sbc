import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireUser";
import { createProduct, listProducts, type ProductInput } from "@/lib/db/products";

export const runtime = "nodejs";

function normalizeFeatures(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (value && typeof value === "object") {
    const maybeLocalized = value as { en?: unknown; ar?: unknown };
    if (Array.isArray(maybeLocalized.en)) {
      return maybeLocalized.en.filter((item): item is string => typeof item === "string");
    }
    if (Array.isArray(maybeLocalized.ar)) {
      return maybeLocalized.ar.filter((item): item is string => typeof item === "string");
    }
  }
  return [];
}

// GET /api/admin/products - لیست محصولات
export async function GET(req: NextRequest) {
  try {
    await requireAdmin("en");
    
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly") === "true";
    
    let products = await listProducts();
    if (activeOnly) {
      products = products.filter(p => p.isActive);
    }
    
    return NextResponse.json({ products });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/admin/products - ایجاد محصول جدید
export async function POST(req: NextRequest) {
  try {
    await requireAdmin("en");
    
    const body = await req.json();
    const input: ProductInput = {
      slug: body.slug,
      program: body.program,
      plan: body.plan,
      durationDays: Number(body.durationDays),
      name: body.name,
      description: body.description,
      price: Number(body.price?.amount ?? body.price),
      currency: body.price?.currency ?? body.currency ?? "OMR",
      badges: body.badges,
      features: normalizeFeatures(body.features),
      isActive: body.isActive ?? body.active ?? true,
      showInDashboard: body.showInDashboard ?? true,
      showInStore: body.showInStore ?? true,
      sortOrder: body.sortOrder ?? 0,
    };
    
    const product = await createProduct(input);
    
    return NextResponse.json({ product }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message === "SLUG_TAKEN") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
