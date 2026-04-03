import { createHmac } from "crypto";

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  try {
    const [encodedPayload, sig] = token.split(".");
    if (!encodedPayload || !sig) return false;
    const payload = Buffer.from(encodedPayload, "base64").toString("utf8");
    const expectedSig = createHmac("sha256", secret).update(payload).digest("hex");
    return sig === expectedSig;
  } catch {
    return false;
  }
}
