import { getApplePassTypeIdentifier } from "./appleConfig";
import { getAppleWalletAuthenticationTokenForSerial } from "./applePass";

export function assertApplePassAuth(req: Request, input: { passTypeIdentifier: string; serialNumber: string }) {
  const expectedPassType = getApplePassTypeIdentifier();
  if (input.passTypeIdentifier !== expectedPassType) {
    throw new Error("INVALID_PASS_TYPE_IDENTIFIER");
  }

  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth) throw new Error("MISSING_AUTH");

  const prefix = "ApplePass ";
  if (!auth.startsWith(prefix)) throw new Error("INVALID_AUTH_SCHEME");

  const token = auth.slice(prefix.length).trim();
  const expected = getAppleWalletAuthenticationTokenForSerial(input.serialNumber);
  if (!token || token !== expected) throw new Error("UNAUTHORIZED");
}
