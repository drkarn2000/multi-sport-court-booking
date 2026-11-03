import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || "pc_session";

function getSecretKey(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ||
    "playcourt-super-secret-jwt-key-2026-production-grade-32b";
  return new TextEncoder().encode(secret);
}

export interface SessionJwtPayload {
  sessionId: string;
  userId: string;
  phone: string;
  fullName: string;
  role: "PLAYER" | "PLATFORM_ADMIN" | "VENUE_MANAGER" | "FINANCE_OPERATOR";
}

export async function signSessionToken(
  payload: SessionJwtPayload
): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.userId || !payload.sessionId || !payload.role) {
      return null;
    }
    return {
      sessionId: String(payload.sessionId),
      userId: String(payload.userId),
      phone: String(payload.phone || ""),
      fullName: String(payload.fullName || ""),
      role: payload.role as SessionJwtPayload["role"],
    };
  } catch {
    return null;
  }
}

