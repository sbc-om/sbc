import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Category } from "@/lib/db/types";
import { BusinessRequestForm } from "./BusinessRequestForm";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const toastMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock("next/dynamic", () => ({
  default: () => () => <div data-testid="osm-location-picker" />,
}));

vi.mock("next/image", () => ({
  default: ({ alt = "" }: { alt?: string }) => <span role="img" aria-label={alt} />,
}));

vi.mock("@/components/ui/Toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/components/ui/MarkdownEditor", () => ({
  MarkdownEditor: ({ value, onChange, placeholder }: { value?: string; onChange: (v: string) => void; placeholder?: string }) => (
    <textarea
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock("@/components/ui/PhoneInput", () => ({
  PhoneInput: ({ value, onChange, placeholder }: { value?: string; onChange: (v: string) => void; placeholder?: string }) => (
    <input value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  ),
}));

const categories: Category[] = [
  {
    id: "cat-1",
    slug: "coffee",
    name: { en: "Coffee", ar: "قهوة" },
    iconId: "coffee",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("BusinessRequestForm category step", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation toast when category is not selected", async () => {
    render(<BusinessRequestForm locale="en" categories={categories} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. Coffee Paradise"), {
      target: { value: "Coffee House" },
    });
    fireEvent.change(screen.getByPlaceholderText("مثال: جنة القهوة"), {
      target: { value: "بيت القهوة" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Please select a category",
          variant: "error",
        }),
      );
    });
  });

  it("goes to contact step after selecting a category", async () => {
    render(<BusinessRequestForm locale="en" categories={categories} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. Coffee Paradise"), {
      target: { value: "Coffee House" },
    });
    fireEvent.change(screen.getByPlaceholderText("مثال: جنة القهوة"), {
      target: { value: "بيت القهوة" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Choose a category/i }));
    fireEvent.click(screen.getByRole("button", { name: /Coffee/i }));

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    await waitFor(() => {
      expect(screen.getByText("Contact Information")).toBeInTheDocument();
    });
  });
});
