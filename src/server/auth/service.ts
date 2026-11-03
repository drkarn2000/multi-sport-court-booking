import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb, runImmediateTransaction } from "@/server/db";
import { isLocalDevEnvironment } from "@/server/utils/env";
import { AppError } from "@/server/utils/http";
import {
  SESSION_COOKIE_NAME,
  SessionJwtPayload,
  signSessionToken,
  verifySessionToken,
} from "./jwt";

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function normalizePhone(phone: string): string {
  return phone.trim().replace(/\s+/g, " ");
}

export interface AuthenticatedUser {
  id: string;
  phone: string;
  email: string;
  fullName: string;
  role: "PLAYER" | "PLATFORM_ADMIN" | "VENUE_MANAGER" | "FINANCE_OPERATOR";
  status: string;
  assignedVenueId: string | null;
}

const DEMO_ADMIN_PHONES = new Set([
  "+91 99999 00001",
  "+91 99999 00002",
  "+91 99999 00003",
]);

/**
 * Request a 6-digit OTP for phone login/signup with rate limiting.
 * - Generates a cryptographically random 6-digit OTP every time.
 * - Never exposes or logs the OTP when PLAYCOURT_ENV="production".
 */
export function requestPhoneOtp(params: {
  phone: string;
  ip?: string;
}): {
  phone: string;
  expiresInSeconds: number;
  requestsUsedInWindow: number;
  maxRequestsPerWindow: number;
  devOtpHint?: string;
} {
  const phone = normalizePhone(params.phone);
  const localDev = isLocalDevEnvironment();

  if (!localDev && DEMO_ADMIN_PHONES.has(phone)) {
    throw new AppError(
      "FORBIDDEN_IN_PRODUCTION",
      "Demo staff accounts are strictly restricted to local development.",
      403
    );
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const windowStartSec = nowSec - 900; // 15-minute sliding window
  const maxRequests = Math.max(
    1,
    Number(process.env.OTP_MAX_REQUESTS_PER_WINDOW || 5)
  );

  return runImmediateTransaction((db) => {
    const recentCount = db
      .prepare(
        `SELECT COUNT(*) as cnt
         FROM otp_verifications
         WHERE phone = ? AND expires_at > ?`
      )
      .get(phone, windowStartSec + 300) as { cnt: number };

    if (recentCount.cnt >= maxRequests) {
      throw new AppError(
        "RATE_LIMITED",
        `Rate limit exceeded (${maxRequests} OTP requests per 15 minutes for ${phone}). Please wait before requesting another code.`,
        429,
        { maxRequestsPerWindow: maxRequests }
      );
    }

    const otpCode = String(crypto.randomInt(100000, 999999));
    const otpId = `otp-${crypto.randomUUID()}`;
    const expiresAt = nowSec + 300; // 5 minutes

    db.prepare(
      `INSERT INTO otp_verifications (id, phone, otp_hash, attempts, max_attempts, expires_at, request_ip)
       VALUES (?, ?, ?, 0, 5, ?, ?)`
    ).run(otpId, phone, sha256(otpCode), expiresAt, params.ip || "127.0.0.1");

    const showDevOtp =
      localDev && process.env.ENABLE_DEV_OTP_HINT !== "false";

    if (showDevOtp) {
      console.info(
        `[PlayCourt Local Dev OTP] Phone: ${phone} | OTP: ${otpCode} | Expires in 300s (${recentCount.cnt + 1}/${maxRequests} requests in window)`
      );
    }

    return {
      phone,
      expiresInSeconds: 300,
      requestsUsedInWindow: recentCount.cnt + 1,
      maxRequestsPerWindow: maxRequests,
      ...(showDevOtp ? { devOtpHint: otpCode } : {}),
    };
  });
}

/**
 * Verify 6-digit OTP against SHA-256 hash stored in `otp_verifications`.
 * Never permits fixed/bypass OTP codes in production or without a valid OTP record.
 */
export async function verifyPhoneOtpAndCreateSession(params: {
  phone: string;
  otp: string;
  fullName?: string;
  email?: string;
}): Promise<{ user: AuthenticatedUser; token: string }> {
  const phone = normalizePhone(params.phone);
  const localDev = isLocalDevEnvironment();

  if (!localDev && DEMO_ADMIN_PHONES.has(phone)) {
    throw new AppError(
      "FORBIDDEN_IN_PRODUCTION",
      "Demo staff accounts are strictly disabled outside local development.",
      403
    );
  }

  const nowSec = Math.floor(Date.now() / 1000);

  const userRecord = runImmediateTransaction((db) => {
    const latestOtp = db
      .prepare(
        `SELECT id, otp_hash, attempts, max_attempts, expires_at
         FROM otp_verifications
         WHERE phone = ? AND consumed_at IS NULL
         ORDER BY rowid DESC
         LIMIT 1`
      )
      .get(phone) as
      | {
          id: string;
          otp_hash: string;
          attempts: number;
          max_attempts: number;
          expires_at: number;
        }
      | undefined;

    if (!latestOtp) {
      throw new AppError(
        "OTP_EXPIRED_OR_INVALID",
        "No active OTP request found for this phone number. Please request an OTP code first.",
        400
      );
    }

    if (latestOtp.expires_at <= nowSec) {
      throw new AppError(
        "OTP_EXPIRED_OR_INVALID",
        "Verification code has expired. Please request a fresh 6-digit OTP.",
        400
      );
    }

    if (latestOtp.attempts >= latestOtp.max_attempts) {
      throw new AppError(
        "OTP_EXPIRED_OR_INVALID",
        "Maximum verification attempts (5) exceeded for this OTP. Please request a new code.",
        400
      );
    }

    const incomingHash = sha256(params.otp.trim());
    if (incomingHash !== latestOtp.otp_hash) {
      const nextAttempts = latestOtp.attempts + 1;
      db.prepare(
        "UPDATE otp_verifications SET attempts = ? WHERE id = ?"
      ).run(nextAttempts, latestOtp.id);

      const remaining = Math.max(0, latestOtp.max_attempts - nextAttempts);
      throw new AppError(
        "OTP_EXPIRED_OR_INVALID",
        `Incorrect 6-digit OTP code. ${remaining} attempt(s) remaining.`,
        400,
        { attemptsRemaining: remaining }
      );
    }

    // Mark OTP as consumed so it can never be replayed
    db.prepare(
      "UPDATE otp_verifications SET consumed_at = ? WHERE id = ?"
    ).run(nowSec, latestOtp.id);

    // Lookup or create User
    let user = db
      .prepare(
        "SELECT id, phone, email, full_name, role, status, assigned_venue_id FROM users WHERE phone = ?"
      )
      .get(phone) as
      | {
          id: string;
          phone: string;
          email: string | null;
          full_name: string;
          role: AuthenticatedUser["role"];
          status: string;
          assigned_venue_id: string | null;
        }
      | undefined;

    if (!user) {
      const newUserId = `usr-${crypto.randomUUID().slice(0, 8)}`;
      const fullName = params.fullName?.trim() || "PlayCourt Player";
      const email =
        params.email?.trim() ||
        `${fullName.toLowerCase().replace(/[^a-z0-9]/g, ".")}.${Date.now().toString().slice(-4)}@example.com`;

      db.prepare(
        `INSERT INTO users (id, phone, email, full_name, role, status, last_active_label)
         VALUES (?, ?, ?, ?, 'PLAYER', 'ACTIVE', 'Today')`
      ).run(newUserId, phone, email, fullName);

      db.prepare(
        `INSERT INTO player_profiles (user_id, city, member_since, preferred_sports_json, skill_levels_json, matches_played, hours_on_court)
         VALUES (?, 'Chandigarh', 'Oct 2026', '["Tennis","Padel"]', '{"Tennis":"Intermediate","Padel":"Beginner","Badminton":"Beginner","Squash":"Beginner"}', 0, 0)`
      ).run(newUserId);

      user = {
        id: newUserId,
        phone,
        email,
        full_name: fullName,
        role: "PLAYER",
        status: "ACTIVE",
        assigned_venue_id: null,
      };
    } else if (params.fullName?.trim() && user.role === "PLAYER") {
      db.prepare(
        "UPDATE users SET full_name = ?, last_active_label = 'Today' WHERE id = ?"
      ).run(params.fullName.trim(), user.id);
      user.full_name = params.fullName.trim();
    }

    if (user.status === "SUSPENDED") {
      throw new AppError(
        "FORBIDDEN_ROLE",
        "This account is currently suspended. Contact PlayCourt operations.",
        403
      );
    }

    const sessionId = `ses-${crypto.randomUUID()}`;
    const sessionExpiry = nowSec + 7 * 86400;
    db.prepare(
      `INSERT INTO user_sessions (id, user_id, token_hash, expires_at)
       VALUES (?, ?, ?, ?)`
    ).run(sessionId, user.id, sha256(sessionId), sessionExpiry);

    return {
      sessionId,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email || "aarav.m@example.com",
        fullName: user.full_name,
        role: user.role,
        status: user.status,
        assignedVenueId: user.assigned_venue_id,
      },
    };
  });

  const jwtPayload: SessionJwtPayload = {
    sessionId: userRecord.sessionId,
    userId: userRecord.user.id,
    phone: userRecord.user.phone,
    fullName: userRecord.user.fullName,
    role: userRecord.user.role,
  };
  const token = await signSessionToken(jwtPayload);

  return { user: userRecord.user, token };
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: !isLocalDevEnvironment(),
    maxAge: 7 * 86400,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token && token !== "logged_out") {
    const payload = await verifySessionToken(token);
    if (payload) {
      const db = getDb();
      db.prepare("UPDATE user_sessions SET revoked_at = ? WHERE id = ?").run(
        Math.floor(Date.now() / 1000),
        payload.sessionId
      );
    }
  }
  // Persist explicit logged_out marker so page reloads stay signed out until next login
  cookieStore.set(SESSION_COOKIE_NAME, "logged_out", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: !isLocalDevEnvironment(),
    maxAge: 7 * 86400,
  });
}

export interface SessionResolution {
  user: AuthenticatedUser | null;
  sessionState: "ACTIVE_COOKIE" | "DEFAULT_DEMO_PLAYER" | "LOGGED_OUT" | "SESSION_EXPIRED";
}

export async function resolveUserSession(options?: {
  allowDefaultDemoPlayer?: boolean;
}): Promise<SessionResolution> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const db = getDb();
  const nowSec = Math.floor(Date.now() / 1000);

  if (token) {
    if (token === "logged_out") {
      return { user: null, sessionState: "LOGGED_OUT" };
    }

    const payload = await verifySessionToken(token);
    if (!payload) {
      return { user: null, sessionState: "SESSION_EXPIRED" };
    }

    const sessionRow = db
      .prepare(
        "SELECT id, revoked_at, expires_at FROM user_sessions WHERE id = ?"
      )
      .get(payload.sessionId) as
      | { id: string; revoked_at: number | null; expires_at: number }
      | undefined;

    if (
      !sessionRow ||
      sessionRow.revoked_at !== null ||
      sessionRow.expires_at <= nowSec
    ) {
      return { user: null, sessionState: "SESSION_EXPIRED" };
    }

    const userRow = db
      .prepare(
        "SELECT id, phone, email, full_name, role, status, assigned_venue_id FROM users WHERE id = ?"
      )
      .get(payload.userId) as
      | {
          id: string;
          phone: string;
          email: string | null;
          full_name: string;
          role: AuthenticatedUser["role"];
          status: string;
          assigned_venue_id: string | null;
        }
      | undefined;

    if (!userRow || userRow.status === "SUSPENDED") {
      return { user: null, sessionState: "SESSION_EXPIRED" };
    }

    if (!isLocalDevEnvironment() && DEMO_ADMIN_PHONES.has(userRow.phone)) {
      return { user: null, sessionState: "SESSION_EXPIRED" };
    }

    return {
      sessionState: "ACTIVE_COOKIE",
      user: {
        id: userRow.id,
        phone: userRow.phone,
        email: userRow.email || "aarav.m@example.com",
        fullName: userRow.full_name,
        role: userRow.role,
        status: userRow.status,
        assignedVenueId: userRow.assigned_venue_id,
      },
    };
  }

  // Only allow default demo player when no cookie exists at all AND running in local dev mode
  if (options?.allowDefaultDemoPlayer !== false && isLocalDevEnvironment()) {
    const defaultUser = db
      .prepare(
        "SELECT id, phone, email, full_name, role, status, assigned_venue_id FROM users WHERE id = 'usr-aarav'"
      )
      .get() as
      | {
          id: string;
          phone: string;
          email: string | null;
          full_name: string;
          role: AuthenticatedUser["role"];
          status: string;
          assigned_venue_id: string | null;
        }
      | undefined;

    if (defaultUser && defaultUser.status !== "SUSPENDED") {
      return {
        sessionState: "DEFAULT_DEMO_PLAYER",
        user: {
          id: defaultUser.id,
          phone: defaultUser.phone,
          email: defaultUser.email || "aarav.m@example.com",
          fullName: defaultUser.full_name,
          role: defaultUser.role,
          status: defaultUser.status,
          assignedVenueId: defaultUser.assigned_venue_id,
        },
      };
    }
  }

  return { user: null, sessionState: "LOGGED_OUT" };
}

export async function getCurrentUser(options?: {
  allowDefaultDemoPlayer?: boolean;
}): Promise<AuthenticatedUser | null> {
  const res = await resolveUserSession(options);
  return res.user;
}

export async function requirePlayerOrAdmin(): Promise<AuthenticatedUser> {
  const res = await resolveUserSession({ allowDefaultDemoPlayer: true });
  if (!res.user) {
    throw new AppError(
      "UNAUTHORIZED",
      res.sessionState === "SESSION_EXPIRED"
        ? "Your session has expired. Please sign in again with your mobile number."
        : "Authentication required. Please sign in with your mobile number.",
      401,
      { sessionState: res.sessionState }
    );
  }
  return res.user;
}

export async function requireAdminRole(
  allowedRoles: Array<
    "PLATFORM_ADMIN" | "VENUE_MANAGER" | "FINANCE_OPERATOR"
  > = ["PLATFORM_ADMIN", "VENUE_MANAGER", "FINANCE_OPERATOR"]
): Promise<AuthenticatedUser> {
  const res = await resolveUserSession({ allowDefaultDemoPlayer: false });
  if (!res.user) {
    throw new AppError(
      "UNAUTHORIZED",
      res.sessionState === "SESSION_EXPIRED"
        ? "Admin session has expired. Please sign in again."
        : "Admin authentication required. Please sign in with an authorized staff account.",
      401,
      { sessionState: res.sessionState }
    );
  }
  if (
    res.user.role === "PLAYER" ||
    !allowedRoles.includes(
      res.user.role as "PLATFORM_ADMIN" | "VENUE_MANAGER" | "FINANCE_OPERATOR"
    )
  ) {
    throw new AppError(
      "FORBIDDEN_ROLE",
      `Insufficient permissions. Required role: ${allowedRoles.join(" or ")}. Current role: ${res.user.role}.`,
      403
    );
  }
  return res.user;
}
