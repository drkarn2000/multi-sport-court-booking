import { NextRequest } from "next/server";
import { z } from "zod";
import {
  setSessionCookie,
  verifyPhoneOtpAndCreateSession,
} from "@/server/auth/service";
import { getPlayerProfileFromDb } from "@/server/services/playcourtService";
import { apiError, apiSuccess } from "@/server/utils/http";

const VerifyOtpSchema = z.object({
  phone: z.string().min(6, "Valid phone number is required."),
  otp: z.string().length(6, "OTP must be 6 digits."),
  fullName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = VerifyOtpSchema.parse(body);
    const { user, token } = await verifyPhoneOtpAndCreateSession({
      phone: parsed.phone,
      otp: parsed.otp,
      fullName: parsed.fullName,
      email: parsed.email || undefined,
    });

    await setSessionCookie(token);
    const profile = getPlayerProfileFromDb(user.id);

    return apiSuccess({ user, profile });
  } catch (err) {
    return apiError(err);
  }
}

