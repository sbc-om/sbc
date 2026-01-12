import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireUser";
import { createProduct, listProducts, type ProductInput } from "@/lib/db/products";

export const runtime = "nodejs";

// GET /api/admin/products - لیست محصولات
export async function GET(req: NextRequest) {
  try {
    await requireAdmin("en");
    
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly") === "true";
    
    const products = listProducts({ activeOnly });
    
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
      price: {
        amount: Number(body.price.amount),
        currency: body.price.currency,
        interval: body.price.interval,
      },
      badges: body.badges,
      features: body.features,
      isActive: body.isActive ?? true,
    };
    
    const product = createProduct(input);
    
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
