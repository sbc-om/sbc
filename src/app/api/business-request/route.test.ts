// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/requireUser", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/db/subscriptions", () => ({
  releaseProgramSubscriptionAssignmentByRequest: vi.fn(),
  reserveNextAvailableProgramSubscription: vi.fn(),
}));

vi.mock("@/lib/db/businessRequests", () => ({
  createBusinessRequest: vi.fn(),
  updateBusinessRequestMedia: vi.fn(),
}));

vi.mock("@/lib/db/businesses", () => ({
  checkBusinessUsernameAvailability: vi.fn(),
}));

vi.mock("@/lib/db/settings", () => ({
  isBusinessRequestAutoApprovalEnabled: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/lib/businessRequests/convertRequestToBusiness", () => ({
  convertBusinessRequestToBusiness: vi.fn(),
}));

vi.mock("@/lib/uploads/storage", () => ({
  storeRequestUpload: vi.fn(),
}));

import { requireUser } from "@/lib/auth/requireUser";
import {
  releaseProgramSubscriptionAssignmentByRequest,
  reserveNextAvailableProgramSubscription,
} from "@/lib/db/subscriptions";
import { createBusinessRequest } from "@/lib/db/businessRequests";
import { checkBusinessUsernameAvailability } from "@/lib/db/businesses";
import { POST } from "./route";

describe("/api/business-request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits request successfully with normalized username check", async () => {
    vi.mocked(requireUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(reserveNextAvailableProgramSubscription).mockResolvedValue({ id: "sub1" } as never);
    vi.mocked(checkBusinessUsernameAvailability).mockResolvedValue({ available: true } as never);
    vi.mocked(createBusinessRequest).mockResolvedValue({ id: "req1", status: "pending" } as never);

    const body = new FormData();
    body.set("username", "  MyBrand  ");
    body.set("name_en", "My Brand");
    body.set("name_ar", "علامتي");
    body.set("desc_en", "desc");
    body.set("desc_ar", "وصف");
    body.set("categoryId", "cat1");
    body.set("city", "Muscat");

    const req = new Request("http://localhost/api/business-request", {
      method: "POST",
      body,
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(checkBusinessUsernameAvailability).toHaveBeenCalledWith("mybrand");
    expect(reserveNextAvailableProgramSubscription).toHaveBeenCalledWith("u1", "directory", expect.any(String));
    expect(createBusinessRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        businessName: "My Brand",
        nameEn: "My Brand",
        city: "Muscat",
      }),
      expect.objectContaining({ requestId: expect.any(String) }),
    );
    expect(releaseProgramSubscriptionAssignmentByRequest).not.toHaveBeenCalled();
    expect(payload.id).toBe("req1");
    expect(res.status).toBe(200);
  });

  it("returns USERNAME_TOO_SHORT for short usernames", async () => {
    vi.mocked(requireUser).mockResolvedValue({ id: "u1" } as never);

    const body = new FormData();
    body.set("username", "abc");

    const req = new Request("http://localhost/api/business-request", {
      method: "POST",
      body,
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload.error).toBe("USERNAME_TOO_SHORT");
    expect(createBusinessRequest).not.toHaveBeenCalled();
    expect(reserveNextAvailableProgramSubscription).not.toHaveBeenCalled();
  });

  it("returns USERNAME_TAKEN when username is unavailable", async () => {
    vi.mocked(requireUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(checkBusinessUsernameAvailability).mockResolvedValue({ available: false, reason: "TAKEN" } as never);

    const body = new FormData();
    body.set("username", "taken-name");

    const req = new Request("http://localhost/api/business-request", {
      method: "POST",
      body,
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload.error).toBe("USERNAME_TAKEN");
    expect(reserveNextAvailableProgramSubscription).not.toHaveBeenCalled();
  });
});
