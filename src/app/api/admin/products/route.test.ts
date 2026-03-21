// @vitest-environment node

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/requireUser", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/db/products", () => ({
  createProduct: vi.fn(),
  listProducts: vi.fn(),
}));

import { requireAdmin } from "@/lib/auth/requireUser";
import { createProduct, listProducts } from "@/lib/db/products";
import { GET, POST } from "./route";

describe("/api/admin/products routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST normalizes localized features and accepts active fallback", async () => {
    vi.mocked(createProduct).mockResolvedValue({ id: "p1" } as never);

    const req = new NextRequest("http://localhost/api/admin/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        slug: "basic",
        program: "directory",
        plan: "basic",
        durationDays: "30",
        name: { en: "Basic", ar: "اساسي" },
        description: { en: "d", ar: "و" },
        price: { amount: "10", currency: "OMR" },
        badges: ["Hot"],
        features: { en: ["A", 1], ar: ["B"] },
        active: false,
      }),
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(requireAdmin).toHaveBeenCalledWith("en");
    expect(createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        durationDays: 30,
        price: 10,
        currency: "OMR",
        features: ["A"],
        isActive: false,
      }),
    );
    expect(res.status).toBe(201);
    expect(payload.product.id).toBe("p1");
  });

  it("GET supports activeOnly filtering", async () => {
    vi.mocked(listProducts).mockResolvedValue([
      { id: "a", isActive: true },
      { id: "b", isActive: false },
    ] as never);

    const req = new NextRequest("http://localhost/api/admin/products?activeOnly=true");
    const res = await GET(req);
    const payload = await res.json();

    expect(payload.products).toEqual([{ id: "a", isActive: true }]);
  });
});
