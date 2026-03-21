import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Category } from "@/lib/db/types";
import { CategorySelect } from "@/components/ui/CategorySelect";
import { CategorySelectField } from "./CategorySelectField";

vi.mock("next/image", () => ({
  default: ({ alt = "" }: { alt?: string } & Record<string, unknown>) => {
    return <span role="img" aria-label={alt} />;
  },
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
  {
    id: "cat-2",
    slug: "restaurant",
    name: { en: "Restaurant", ar: "مطعم" },
    iconId: "restaurant",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("CategorySelect and CategorySelectField", () => {
  it("CategorySelect (controlled) calls onChange with selected category", async () => {
    const onChange = vi.fn();

    render(
      <CategorySelect
        categories={categories}
        value=""
        onChange={onChange}
        placeholder="Choose a category"
        locale="en"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Choose a category/i }));
    fireEvent.click(screen.getByRole("button", { name: /Restaurant/i }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith("cat-2");
    });
  });

  it("CategorySelectField (uncontrolled) stores selected value in hidden input", async () => {
    const { container } = render(
      <CategorySelectField
        categories={categories}
        locale="en"
        placeholder="Choose a category"
        searchPlaceholder="Search categories"
        required
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Choose a category/i }));
    fireEvent.click(screen.getByRole("button", { name: /Coffee/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Coffee/i })).toBeInTheDocument();
    });

    const hiddenInput = container.querySelector('input[name="categoryId"]') as HTMLInputElement | null;
    expect(hiddenInput).not.toBeNull();
    expect(hiddenInput?.value).toBe("cat-1");
    expect(hiddenInput?.required).toBe(true);
  });

  it("locks body scroll when open and restores it after Escape", async () => {
    render(
      <CategorySelect
        categories={categories}
        value=""
        onChange={() => undefined}
        placeholder="Choose a category"
        locale="en"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Choose a category/i }));

    await waitFor(() => {
      expect(screen.getByText("Select Category")).toBeInTheDocument();
    });
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByText("Select Category")).not.toBeInTheDocument();
    });
    expect(document.body.style.overflow).toBe("");
  });

  it("closes modal when clicking outside dialog container", async () => {
    render(
      <CategorySelect
        categories={categories}
        value=""
        onChange={() => undefined}
        placeholder="Choose a category"
        locale="en"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Choose a category/i }));

    await waitFor(() => {
      expect(screen.getByText("Select Category")).toBeInTheDocument();
    });

    const overlay = Array.from(document.querySelectorAll("div")).find((el) =>
      el.className.includes("fixed inset-0 z-[99999]"),
    );
    expect(overlay).toBeTruthy();

    fireEvent.click(overlay as HTMLElement);

    await waitFor(() => {
      expect(screen.queryByText("Select Category")).not.toBeInTheDocument();
    });
  });
});
