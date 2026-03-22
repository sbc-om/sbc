import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { SidebarLayout, useSidebar } from "./SidebarLayout";

function SidebarProbe() {
  const { collapsed, setCollapsed, isMobile } = useSidebar();

  return (
    <div>
      <div data-testid="collapsed">{String(collapsed)}</div>
      <div data-testid="mobile">{String(isMobile)}</div>
      <button type="button" onClick={() => setCollapsed(!collapsed)}>
        toggle
      </button>
    </div>
  );
}

describe("SidebarLayout", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty("--sidebar-width");
    delete document.documentElement.dataset.sidebarCollapsed;
  });

  it("hydrates initial state from window size and localStorage", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 800,
    });
    localStorage.setItem("sidebarCollapsed", "true");

    render(
      <SidebarLayout>
        <SidebarProbe />
      </SidebarLayout>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("collapsed")).toHaveTextContent("true");
      expect(screen.getByTestId("mobile")).toHaveTextContent("true");
    });
  });

  it("updates css variables and persists collapsed state on desktop", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1400,
    });

    render(
      <SidebarLayout>
        <SidebarProbe />
      </SidebarLayout>,
    );

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--sidebar-width")).toBe("16rem");
    });

    fireEvent.click(screen.getByRole("button", { name: "toggle" }));

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--sidebar-width")).toBe("5rem");
      expect(document.documentElement.dataset.sidebarCollapsed).toBe("true");
      expect(localStorage.getItem("sidebarCollapsed")).toBe("true");
    });
  });

  it("reacts to resize changes for isMobile", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1400,
    });

    render(
      <SidebarLayout>
        <SidebarProbe />
      </SidebarLayout>,
    );

    expect(screen.getByTestId("mobile")).toHaveTextContent("false");

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 900,
    });
    window.dispatchEvent(new Event("resize"));

    await waitFor(() => {
      expect(screen.getByTestId("mobile")).toHaveTextContent("true");
    });
  });

  it("repairs pre-hydration sidebar mismatch on first mount", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1400,
    });
    localStorage.setItem("sidebarCollapsed", "true");

    // Simulate stale pre-hydration values (expanded width while collapsed flag should be true).
    document.documentElement.style.setProperty("--sidebar-width", "16rem");
    document.documentElement.dataset.sidebarCollapsed = "false";

    render(
      <SidebarLayout>
        <SidebarProbe />
      </SidebarLayout>,
    );

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--sidebar-width")).toBe("5rem");
      expect(document.documentElement.dataset.sidebarCollapsed).toBe("true");
    });
  });
});
