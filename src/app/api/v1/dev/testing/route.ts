import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/server/auth/jwt";
import { normalizePhone } from "@/server/auth/service";
import { getDb, resetAndReseedDatabase } from "@/server/db";
import { getBootstrapState } from "@/server/services/playcourtService";
import { assertLocalDevEnvironment } from "@/server/utils/env";
import { AppError, apiError, apiSuccess } from "@/server/utils/http";

const DevTestingSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("expire_latest_otp"),
    phone: z.string().min(6),
  }),
  z.object({
    action: z.literal("reset_otp_rate_limit"),
    phone: z.string().min(6),
  }),
  z.object({
    action: z.literal("expire_current_session"),
  }),
  z.object({
    action: z.literal("reseed_demo_db"),
    confirm: z.literal("RESET_LOCAL_DEMO_DB"),
  }),
]);

export async function POST(req: NextRequest) {
  try {
    assertLocalDevEnvironment("Local manual testing helper API");

    const body = await req.json();
    const parsed = DevTestingSchema.parse(body);
    const db = getDb();
    const nowSec = Math.floor(Date.now() / 1000);

    if (parsed.action === "expire_latest_otp") {
      const phone = normalizePhone(parsed.phone);
      const latest = db
        .prepare(
          `SELECT id FROM otp_verifications
           WHERE phone = ? AND consumed_at IS NULL
           ORDER BY rowid DESC LIMIT 1`
        )
        .get(phone) as { id: string } | undefined;

      if (!latest) {
        throw new AppError(
          "NOT_FOUND",
          "No active OTP found for this phone number to expire.",
          404
        );
      }

      db.prepare(
        "UPDATE otp_verifications SET expires_at = ? WHERE id = ?"
      ).run(nowSec - 120, latest.id);

      return apiSuccess({
        expiredOtpId: latest.id,
        message: "Latest OTP marked expired for manual testing.",
      });
    }

    if (parsed.action === "reset_otp_rate_limit") {
      const phone = normalizePhone(parsed.phone);
      db.prepare("DELETE FROM otp_verifications WHERE phone = ?").run(phone);
      return apiSuccess({
        phone,
        message: "OTP rate-limit window cleared for local testing.",
      });
    }

    if (parsed.action === "expire_current_session") {
      const cookieStore = await cookies();
      const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      if (!token || token === "logged_out") {
        throw new AppError(
          "VALIDATION_ERROR",
          "Sign in via OTP first so an active DB session cookie exists to expire.",
          400
        );
      }
      const payload = await verifySessionToken(token);
      if (payload) {
        db.prepare(
          "UPDATE user_sessions SET expires_at = ? WHERE id = ?"
        ).run(nowSec - 120, payload.sessionId);
      }
      return apiSuccess({
        expired: true,
        message:
          "Current DB session expired immediately. Any protected action will now return 401 SESSION_EXPIRED.",
      });
    }

    if (parsed.action === "reseed_demo_db") {
      resetAndReseedDatabase();
      const state = getBootstrapState(null);
      return apiSuccess({
        reset: true,
        message: "Local SQLite demo database reseeded to initial state.",
        state,
      });
    }

    throw new AppError("VALIDATION_ERROR", "Unsupported dev action", 400);
  } catch (err) {
    return apiError(err);
  }
}

