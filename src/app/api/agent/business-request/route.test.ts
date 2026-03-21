// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/currentUser", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/db/agents", () => ({
  getAgentByUserId: vi.fn(),
  isAgentClient: vi.fn(),
  createCommission: vi.fn(),
}));

vi.mock("@/lib/db/businessRequests", () => ({
  createBusinessRequest: vi.fn(),
}));

vi.mock("@/lib/db/wallet", () => ({
  getAvailableBalance: vi.fn(),
  withdrawFromWallet: vi.fn(),
  depositToWallet: vi.fn(),
  ensureWallet: vi.fn(),
}));

vi.mock("@/lib/db/subscriptions", () => ({
  purchaseProgramSubscription: vi.fn(),
}));

vi.mock("@/lib/store/products", () => ({
  getStoreProductBySlug: vi.fn(),
}));

vi.mock("@/lib/db/postgres", () => ({
  query: vi.fn(),
}));

vi.mock("@/lib/db/businesses", () => ({
  checkBusinessUsernameAvailability: vi.fn(),
}));

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getAgentByUserId, isAgentClient, createCommission } from "@/lib/db/agents";
import { createBusinessRequest } from "@/lib/db/businessRequests";
import { getAvailableBalance, withdrawFromWallet, depositToWallet, ensureWallet } from "@/lib/db/wallet";
import { purchaseProgramSubscription } from "@/lib/db/subscriptions";
import { getStoreProductBySlug } from "@/lib/store/products";
import { query } from "@/lib/db/postgres";
import { checkBusinessUsernameAvailability } from "@/lib/db/businesses";
import { POST } from "./route";

describe("/api/agent/business-request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not logged in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const req = new Request("http://localhost/api/agent/business-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(401);
    expect(payload.ok).toBe(false);
  });

  it("returns 400 for short username", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "a1", role: "agent" } as never);
    vi.mocked(getAgentByUserId).mockResolvedValue({ userId: "a1", commissionRate: 0.1 } as never);

    const req = new Request("http://localhost/api/agent/business-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "abc" }),
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload.error).toBe("USERNAME_TOO_SHORT");
  });

  it("creates request and processes paid plan for client", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "agent1", role: "agent" } as never);
    vi.mocked(getAgentByUserId).mockResolvedValue({ userId: "agent1", commissionRate: 0.2 } as never);
    vi.mocked(checkBusinessUsernameAvailability).mockResolvedValue({ available: true } as never);
    vi.mocked(isAgentClient).mockResolvedValue(true);
    vi.mocked(getStoreProductBySlug).mockResolvedValue({
      id: "prod1",
      slug: "directory-basic",
      program: "directory",
      durationDays: 30,
      price: { amount: 10, currency: "OMR" },
    } as never);
    vi.mocked(getAvailableBalance).mockResolvedValue({ availableBalance: 100 } as never);
    vi.mocked(query)
      .mockResolvedValueOnce({ rows: [{ is_phone_verified: true }] } as never)
      .mockResolvedValueOnce({ rows: [{ phone: "+96890000000" }] } as never)
      .mockResolvedValueOnce({ rows: [{ user_id: "sbc-treasury" }] } as never);
    vi.mocked(purchaseProgramSubscription).mockResolvedValue({ id: "sub1" } as never);
    vi.mocked(createBusinessRequest).mockResolvedValue({ id: "req1" } as never);

    const req = new Request("http://localhost/api/agent/business-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clientUserId: "client1",
        productSlug: "directory-basic",
        username: "brandname",
        name_en: "Brand Name",
      }),
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(ensureWallet).toHaveBeenCalledWith("client1", "+96890000000");
    expect(withdrawFromWallet).toHaveBeenCalled();
    expect(depositToWallet).toHaveBeenCalled();
    expect(purchaseProgramSubscription).toHaveBeenCalled();
    expect(createCommission).toHaveBeenCalled();
    expect(createBusinessRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        agentUserId: "agent1",
        userId: "client1",
        businessName: "Brand Name",
      }),
    );
    expect(res.status).toBe(200);
    expect(payload.ok).toBe(true);
  });

  it("returns CLIENT_PHONE_NOT_VERIFIED when client phone is not verified", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "agent1", role: "agent" } as never);
    vi.mocked(getAgentByUserId).mockResolvedValue({ userId: "agent1", commissionRate: 0.2 } as never);
    vi.mocked(checkBusinessUsernameAvailability).mockResolvedValue({ available: true } as never);
    vi.mocked(query).mockResolvedValueOnce({ rows: [{ is_phone_verified: false }] } as never);

    const req = new Request("http://localhost/api/agent/business-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clientUserId: "client1",
        productSlug: "directory-basic",
        username: "brandname",
      }),
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(403);
    expect(payload.error).toBe("CLIENT_PHONE_NOT_VERIFIED");
    expect(getStoreProductBySlug).not.toHaveBeenCalled();
  });

  it("returns PRODUCT_NOT_FOUND when requested plan does not exist", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "agent1", role: "agent" } as never);
    vi.mocked(getAgentByUserId).mockResolvedValue({ userId: "agent1", commissionRate: 0.2 } as never);
    vi.mocked(checkBusinessUsernameAvailability).mockResolvedValue({ available: true } as never);
    vi.mocked(isAgentClient).mockResolvedValue(true);
    vi.mocked(query).mockResolvedValueOnce({ rows: [{ is_phone_verified: true }] } as never);
    vi.mocked(getStoreProductBySlug).mockResolvedValue(null);

    const req = new Request("http://localhost/api/agent/business-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clientUserId: "client1",
        productSlug: "missing-plan",
        username: "brandname",
      }),
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(404);
    expect(payload.error).toBe("PRODUCT_NOT_FOUND");
    expect(getAvailableBalance).not.toHaveBeenCalled();
  });

  it("returns CLIENT_INSUFFICIENT_BALANCE when client funds are low", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "agent1", role: "agent" } as never);
    vi.mocked(getAgentByUserId).mockResolvedValue({ userId: "agent1", commissionRate: 0.2 } as never);
    vi.mocked(checkBusinessUsernameAvailability).mockResolvedValue({ available: true } as never);
    vi.mocked(isAgentClient).mockResolvedValue(true);
    vi.mocked(query).mockResolvedValueOnce({ rows: [{ is_phone_verified: true }] } as never);
    vi.mocked(getStoreProductBySlug).mockResolvedValue({
      id: "prod1",
      slug: "directory-basic",
      program: "directory",
      durationDays: 30,
      price: { amount: 10, currency: "OMR" },
    } as never);
    vi.mocked(getAvailableBalance).mockResolvedValue({ availableBalance: 3 } as never);

    const req = new Request("http://localhost/api/agent/business-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clientUserId: "client1",
        productSlug: "directory-basic",
        username: "brandname",
      }),
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload.error).toBe("CLIENT_INSUFFICIENT_BALANCE");
    expect(withdrawFromWallet).not.toHaveBeenCalled();
  });
});
