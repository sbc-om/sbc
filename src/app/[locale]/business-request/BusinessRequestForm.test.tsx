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

describe("BusinessRequestForm conversational flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation toast when name is empty and Continue is clicked", async () => {
    render(<BusinessRequestForm locale="en" categories={categories} />);

    // First slide asks for English name
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Please enter business name",
          variant: "error",
        }),
      );
    });
  });

  it("advances through name slides to category", async () => {
    render(<BusinessRequestForm locale="en" categories={categories} />);

    // Slide 1: English name
    fireEvent.change(screen.getByPlaceholderText("e.g. Coffee Paradise"), {
      target: { value: "Coffee House" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    // Slide 2: Arabic name
    await waitFor(() => {
      expect(screen.getByPlaceholderText("مثال: جنة القهوة")).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText("مثال: جنة القهوة"), {
      target: { value: "بيت القهوة" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    // Slide 3: Category
    await waitFor(() => {
      expect(screen.getByText("What type of business is it?")).toBeInTheDocument();
    });
  });
});
