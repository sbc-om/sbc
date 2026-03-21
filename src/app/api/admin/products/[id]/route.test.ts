// @vitest-environment node

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/requireUser", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/db/products", () => ({
  getProductById: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  setProductActive: vi.fn(),
}));

import { getProductById, setProductActive, updateProduct } from "@/lib/db/products";
import { PATCH, POST } from "./route";

describe("/api/admin/products/[id] routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("PATCH normalizes payload before calling updateProduct", async () => {
    vi.mocked(updateProduct).mockResolvedValue({ id: "p1" } as never);

    const req = new NextRequest("http://localhost/api/admin/products/p1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        durationDays: "45",
        price: { amount: "22", currency: "OMR" },
        features: { en: ["One", 5], ar: ["Uno"] },
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "p1" }) });

    expect(updateProduct).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({
        durationDays: 45,
        price: 22,
        currency: "OMR",
        features: ["One"],
      }),
    );
    expect(res.status).toBe(200);
  });

  it("PATCH maps NOT_FOUND to 404", async () => {
    vi.mocked(updateProduct).mockRejectedValue(new Error("NOT_FOUND"));

    const req = new NextRequest("http://localhost/api/admin/products/p1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: "x" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "p1" }) });

    expect(res.status).toBe(404);
  });

  it("toggle POST flips active status", async () => {
    vi.mocked(getProductById).mockResolvedValue({ id: "p1", isActive: true } as never);
    vi.mocked(setProductActive).mockResolvedValue({ id: "p1", isActive: false } as never);

    const req = new NextRequest("http://localhost/api/admin/products/p1/toggle", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    const payload = await res.json();

    expect(setProductActive).toHaveBeenCalledWith("p1", false);
    expect(payload.product.isActive).toBe(false);
  });
});
