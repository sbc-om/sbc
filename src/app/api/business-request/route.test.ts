// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/requireUser", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/db/subscriptions", () => ({
  ensureActiveProgramSubscription: vi.fn(),
}));

vi.mock("@/lib/db/businessRequests", () => ({
  createBusinessRequest: vi.fn(),
}));

vi.mock("@/lib/db/businesses", () => ({
  checkBusinessUsernameAvailability: vi.fn(),
}));

import { requireUser } from "@/lib/auth/requireUser";
import { ensureActiveProgramSubscription } from "@/lib/db/subscriptions";
import { createBusinessRequest } from "@/lib/db/businessRequests";
import { checkBusinessUsernameAvailability } from "@/lib/db/businesses";
import { POST } from "./route";

describe("/api/business-request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits request successfully with normalized username check", async () => {
    vi.mocked(requireUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(ensureActiveProgramSubscription).mockResolvedValue(undefined);
    vi.mocked(checkBusinessUsernameAvailability).mockResolvedValue({ available: true } as never);
    vi.mocked(createBusinessRequest).mockResolvedValue({ id: "req1", status: "pending" } as never);

    const req = new Request("http://localhost/api/business-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: "  MyBrand  ",
        name_en: "My Brand",
        name_ar: "علامتي",
        desc_en: "desc",
        desc_ar: "وصف",
        categoryId: "cat1",
        city: "Muscat",
      }),
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(ensureActiveProgramSubscription).toHaveBeenCalledWith("u1", "directory");
    expect(checkBusinessUsernameAvailability).toHaveBeenCalledWith("mybrand");
    expect(createBusinessRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        businessName: "My Brand",
        nameEn: "My Brand",
        city: "Muscat",
      }),
    );
    expect(payload.id).toBe("req1");
    expect(res.status).toBe(200);
  });

  it("returns USERNAME_TOO_SHORT for short usernames", async () => {
    vi.mocked(requireUser).mockResolvedValue({ id: "u1" } as never);

    const req = new Request("http://localhost/api/business-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "abc" }),
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload.error).toBe("USERNAME_TOO_SHORT");
    expect(createBusinessRequest).not.toHaveBeenCalled();
  });

  it("returns USERNAME_TAKEN when username is unavailable", async () => {
    vi.mocked(requireUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(checkBusinessUsernameAvailability).mockResolvedValue({ available: false, reason: "TAKEN" } as never);

    const req = new Request("http://localhost/api/business-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "taken-name" }),
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload.error).toBe("USERNAME_TAKEN");
  });
});
