import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireUser";
import { 
  getProductById, 
  updateProduct, 
  deleteProduct, 
  setProductActive,
  type ProductInput 
} from "@/lib/db/products";

export const runtime = "nodejs";

// GET /api/admin/products/[id] - دریافت محصول
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("en");
    const { id } = await params;
    
    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    return NextResponse.json({ product });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/admin/products/[id] - ویرایش محصول
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("en");
    const { id } = await params;
    
    const body = await req.json();
    const input: Partial<ProductInput> = {};
    
    if (body.slug !== undefined) input.slug = body.slug;
    if (body.program !== undefined) input.program = body.program;
    if (body.plan !== undefined) input.plan = body.plan;
    if (body.durationDays !== undefined) input.durationDays = Number(body.durationDays);
    if (body.name !== undefined) input.name = body.name;
    if (body.description !== undefined) input.description = body.description;
    if (body.price !== undefined) {
      input.price = Number(body.price.amount ?? body.price);
    }
    if (body.currency !== undefined) input.currency = body.currency;
    if (body.badges !== undefined) input.badges = body.badges;
    if (body.features !== undefined) input.features = body.features;
    if (body.isActive !== undefined) input.isActive = body.isActive;
    
    const product = await updateProduct(id, input);
    
    return NextResponse.json({ product });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (message === "SLUG_TAKEN") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id] - حذف محصول
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("en");
    const { id } = await params;
    
    await deleteProduct(id);
    
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/admin/products/[id]/toggle - تغییر وضعیت فعال/غیرفعال
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("en");
    const { id } = await params;
    
    // Get current product to determine new status
    const current = await getProductById(id);
    if (!current) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const product = await setProductActive(id, !current.isActive);
    
    return NextResponse.json({ product });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
