import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("@/lib/i18n/getDictionary", () => ({
  getDictionary: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/auth/currentUser", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/db/subscriptions", () => ({
  isProgramSubscriptionActive: vi.fn(),
}));

vi.mock("@/lib/db/loyalty", () => ({
  defaultLoyaltySettings: vi.fn((userId: string) => ({
    userId,
    pointsRequiredPerRedemption: 10,
    pointsDeductPerRedemption: 10,
    pointsIconMode: "logo",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  })),
  getLoyaltyProfileByUserId: vi.fn(),
  getLoyaltySettingsByUserId: vi.fn(),
  listLoyaltyCustomersByUser: vi.fn(),
}));

vi.mock("@/lib/db/loyaltyStaff", () => ({
  listLoyaltyStaffByUser: vi.fn(),
}));

vi.mock("./LoyaltyProfileClient", () => ({
  LoyaltyProfileClient: () => <div>Profile Client</div>,
}));

vi.mock("./LoyaltySettingsClient", () => ({
  LoyaltySettingsClient: () => <div>Settings Client</div>,
}));

vi.mock("./LoyaltyMessagesClient", () => ({
  LoyaltyMessagesClient: () => <div>Messages Client</div>,
}));

vi.mock("./LoyaltyStaffManager", () => ({
  LoyaltyStaffManager: () => <div>Staff Manager</div>,
}));

import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getLoyaltyProfileByUserId,
  getLoyaltySettingsByUserId,
  listLoyaltyCustomersByUser,
} from "@/lib/db/loyalty";
import { listLoyaltyStaffByUser } from "@/lib/db/loyaltyStaff";
import { isProgramSubscriptionActive } from "@/lib/db/subscriptions";
import LoyaltyManagePage from "./page";

describe("Loyalty manage page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(headers).mockResolvedValue(
      new Headers({ host: "localhost:3000", "x-forwarded-proto": "http" }),
    );
  });

  it("shows login actions when user is not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const ui = (await LoyaltyManagePage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    })) as ReactElement;

    render(ui);

    expect(screen.getByText("Manage loyalty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create account" })).toBeInTheDocument();
  });

  it("shows management sections when user has active subscription", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(isProgramSubscriptionActive).mockResolvedValue(true);
    vi.mocked(listLoyaltyCustomersByUser).mockResolvedValue([{ id: "c1" }] as never);
    vi.mocked(getLoyaltyProfileByUserId).mockResolvedValue({
      businessName: "SBC Cafe",
      joinCode: "SBC2026",
      logoUrl: null,
    } as never);
    vi.mocked(getLoyaltySettingsByUserId).mockResolvedValue({
      userId: "u1",
      pointsRequiredPerRedemption: 10,
      pointsDeductPerRedemption: 10,
      pointsIconMode: "logo",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as never);
    vi.mocked(listLoyaltyStaffByUser).mockResolvedValue([] as never);

    const ui = (await LoyaltyManagePage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    })) as ReactElement;

    render(ui);

    expect(screen.getByText("Profile Client")).toBeInTheDocument();
    expect(screen.getByText("Settings Client")).toBeInTheDocument();
    expect(screen.getByText("Messages Client")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open Lookup Page/i })).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
