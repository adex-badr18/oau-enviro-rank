import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET || "";

// Throws an error if SESSION SECRET is missing
if (!SECRET) {
  throw new Error("FATAL: SESSION_SECRET environment variable is not set. The application cannot start securely.");
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  expiresAt: number;
}

/**
 * Signs a session payload using HMAC-SHA256, returning a "data.signature" token.
 * Defaults to 24 hours duration.
 */
export function signToken(payload: Omit<SessionPayload, "expiresAt">, durationMs = 24 * 60 * 60 * 1000): string {
  const expiresAt = Date.now() + durationMs;
  const fullPayload: SessionPayload = { ...payload, expiresAt };
  const data = Buffer.from(JSON.stringify(fullPayload)).toString("base64");
  const hmac = crypto.createHmac("sha256", SECRET).update(data).digest("hex");
  return `${data}.${hmac}`;
}

/**
 * Verifies a token's signature and expiration, returning the deserialized payload or null.
 */
export function verifyToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, hmac] = parts;
    const expectedHmac = crypto.createHmac("sha256", SECRET).update(data).digest("hex");

    // Timing-safe verification of the signature
    const hmacBuf = Buffer.from(hmac, "hex");
    const expectedBuf = Buffer.from(expectedHmac, "hex");
    if (hmacBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(hmacBuf, expectedBuf)) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    console.error("Token verification error:", err);
    return null;
  }
}
