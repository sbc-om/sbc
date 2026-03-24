import { afterEach, describe, expect, it } from "vitest";

import {
  resolvePasskeyExpectedOrigins,
  resolvePasskeyExpectedRpIds,
  resolvePasskeyOrigin,
  resolvePasskeyRpId,
} from "./passkeyConfig";

const ORIGINAL_ENV = {
  PASSKEY_ORIGIN: process.env.PASSKEY_ORIGIN,
  PASSKEY_RP_ID: process.env.PASSKEY_RP_ID,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
};

afterEach(() => {
  process.env.PASSKEY_ORIGIN = ORIGINAL_ENV.PASSKEY_ORIGIN;
  process.env.PASSKEY_RP_ID = ORIGINAL_ENV.PASSKEY_RP_ID;
  process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_ENV.NEXT_PUBLIC_SITE_URL;
});

function request(url: string, headers: HeadersInit = {}) {
  return new Request(url, { method: "POST", headers });
}

describe("passkeyConfig", () => {
  it("prefers explicit PASSKEY_ORIGIN list", () => {
    process.env.PASSKEY_ORIGIN = "https://sbc.om, https://www.sbc.om";

    const req = request("http://localhost:3000/api/auth/passkey/registration/verify");
    const origins = resolvePasskeyExpectedOrigins(req);

    expect(origins).toEqual(["https://sbc.om", "https://www.sbc.om"]);
    expect(resolvePasskeyOrigin(req)).toBe("https://sbc.om");
  });

  it("uses env apex RP ID when origin is a subdomain", () => {
    process.env.PASSKEY_ORIGIN = "";
    process.env.PASSKEY_RP_ID = "";
    process.env.NEXT_PUBLIC_SITE_URL = "https://sbc.om";

    const req = request("http://localhost:3000/api/auth/passkey/registration/options", {
      origin: "https://www.sbc.om",
      host: "www.sbc.om",
      "x-forwarded-proto": "https",
      "x-forwarded-host": "www.sbc.om",
    });

    const rpIds = resolvePasskeyExpectedRpIds(req);
    expect(rpIds[0]).toBe("sbc.om");
    expect(resolvePasskeyRpId(req)).toBe("sbc.om");
  });

  it("prefers origin/request host when env host is unrelated", () => {
    process.env.PASSKEY_ORIGIN = "";
    process.env.PASSKEY_RP_ID = "";
    process.env.NEXT_PUBLIC_SITE_URL = "https://sbc.om";

    const req = request("http://localhost:3000/api/auth/passkey/registration/options", {
      origin: "http://localhost:3000",
      host: "localhost:3000",
      "x-forwarded-proto": "http",
      "x-forwarded-host": "localhost:3000",
    });

    expect(resolvePasskeyOrigin(req)).toBe("http://localhost:3000");
    expect(resolvePasskeyRpId(req)).toBe("localhost");
  });
});
