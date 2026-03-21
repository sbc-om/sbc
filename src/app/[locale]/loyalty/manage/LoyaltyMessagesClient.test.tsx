import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoyaltyMessagesClient } from "./LoyaltyMessagesClient";

describe("LoyaltyMessagesClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends message to all customers and clears fields on success", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        message: { id: "m1", userId: "u1", title: "Promo", body: "Hello", createdAt: new Date().toISOString() },
      }),
    } as Response);

    render(<LoyaltyMessagesClient locale="en" />);

    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "Promo" } });
    fireEvent.change(screen.getAllByRole("textbox")[1], { target: { value: "Hello everyone" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/loyalty/messages",
        expect.objectContaining({ method: "POST" }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Sent")).toBeInTheDocument();
    });

    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string) as {
      customerId?: string;
      title: string;
      body: string;
    };
    expect(body.customerId).toBeUndefined();
    expect(body.title).toBe("Promo");
    expect(body.body).toBe("Hello everyone");
    expect((screen.getAllByRole("textbox")[0] as HTMLInputElement).value).toBe("");
    expect((screen.getAllByRole("textbox")[1] as HTMLTextAreaElement).value).toBe("");
  });

  it("sends to one customer when single mode is selected", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, message: { id: "m2", userId: "u1", title: "t", body: "b", createdAt: new Date().toISOString() } }),
    } as Response);

    render(<LoyaltyMessagesClient locale="en" />);

    fireEvent.click(screen.getByRole("radio", { name: "Send to one customer" }));

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "cust-1" } });
    fireEvent.change(inputs[1], { target: { value: "Personal" } });
    fireEvent.change(inputs[2], { target: { value: "Hi" } });

    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string) as {
      customerId?: string;
      title: string;
      body: string;
    };

    expect(body.customerId).toBe("cust-1");
    expect(body.title).toBe("Personal");
    expect(body.body).toBe("Hi");
  });
});
