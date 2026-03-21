import { describe, expect, it } from "vitest";

import type { Product } from "@/lib/db/products";
import { toStoreAdminProduct } from "./productMapper";

function baseProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    slug: "basic-plan",
    name: { en: "Basic", ar: "أساسي" },
    description: { en: "Basic desc", ar: "وصف" },
    price: 12.5,
    currency: "OMR",
    program: "directory",
    plan: "basic",
    durationDays: 30,
    features: ["A", "B"],
    badges: ["Hot"],
    isActive: true,
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("toStoreAdminProduct", () => {
  it("maps basic db product to store shape", () => {
    const result = toStoreAdminProduct(baseProduct());

    expect(result.price.amount).toBe(12.5);
    expect(result.price.currency).toBe("OMR");
    expect(result.features.en).toEqual(["A", "B"]);
    expect(result.features.ar).toEqual(["A", "B"]);
    expect(result.durationDays).toBe(30);
  });

  it("falls back safely for unexpected values", () => {
    const result = toStoreAdminProduct(
      baseProduct({
        program: "unsupported",
        durationDays: undefined,
        description: undefined,
        badges: undefined,
      }),
    );

    expect(result.program).toBe("directory");
    expect(result.durationDays).toBe(365);
    expect(result.description).toEqual({ en: "", ar: "" });
    expect(result.badges).toEqual([]);
  });

  it("handles legacy localized features object from old records", () => {
    const legacy = baseProduct({
      features: { en: ["EN1"], ar: ["AR1"] } as unknown as string[],
    });

    const result = toStoreAdminProduct(legacy);

    expect(result.features.en).toEqual(["EN1"]);
    expect(result.features.ar).toEqual(["AR1"]);
  });
});
