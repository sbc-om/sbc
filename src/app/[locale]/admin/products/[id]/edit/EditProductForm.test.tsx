import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EditProductForm } from "./EditProductForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/components/ui/Toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("EditProductForm", () => {
  it("renders safely when runtime data is incomplete", () => {
    const malformedProduct = {
      id: "p1",
      slug: "legacy-product",
      program: "directory",
      plan: "basic",
      durationDays: 30,
      name: { en: "Legacy", ar: "قديم" },
      description: undefined,
      price: { amount: 10, currency: "OMR" },
      features: undefined,
      badges: undefined,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as never;

    render(<EditProductForm product={malformedProduct} locale="en" />);

    expect(screen.getByDisplayValue("legacy-product")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Annual membership in the business directory."),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("textbox").length).toBeGreaterThan(0);
  });
});
