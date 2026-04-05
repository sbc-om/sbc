import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Dictionary } from "@/lib/i18n/getDictionary";
import { MobileNav } from "./MobileNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/home",
}));

vi.mock("@/app/[locale]/auth/actions", () => ({
  logoutAction: vi.fn(),
}));

const dict = {
  nav: {
    explore: "Explore",
    categories: "Categories",
    profile: "Profile",
    dashboard: "Dashboard",
    settings: "Settings",
    admin: "Admin",
    logout: "Logout",
    chat: "Chat",
  },
} as unknown as Dictionary;

describe("MobileNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
    localStorage.clear();
  });

  it("does not render map navigation item", () => {
    render(<MobileNav locale="en" dict={dict} user={{ role: "admin" }} />);

    expect(screen.queryByText("Map")).not.toBeInTheDocument();
  });

  it("opens profile menu and closes on escape/outside click", async () => {
    render(<MobileNav locale="en" dict={dict} user={{ role: "admin" }} />);

    fireEvent.click(screen.getByRole("button", { name: /Profile/i }));

    await waitFor(() => {
      expect(screen.getByRole("menu", { name: "Profile menu" })).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("menu", { name: "Profile menu" })).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Profile/i }));
    await waitFor(() => {
      expect(screen.getByRole("menu", { name: "Profile menu" })).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByRole("menu", { name: "Profile menu" })).not.toBeInTheDocument();
    });
  });

  it("keeps Store out of bottom nav and shows it in profile menu", async () => {
    const { container } = render(<MobileNav locale="en" dict={dict} user={{ role: "admin" }} />);

    expect(container.querySelector('a[href="/en/store"]')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Profile/i }));

    await screen.findByRole("menu", { name: "Profile menu" });
    expect(container.querySelector('a[href="/en/store"]')).toBeInTheDocument();
  });
});
