import { NextRequest } from "next/server";
import { z } from "zod";
import { requestPhoneOtp } from "@/server/auth/service";
import { apiError, apiSuccess } from "@/server/utils/http";

const RequestOtpSchema = z.object({
  phone: z.string().min(6, "Valid mobile phone number is required."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestOtpSchema.parse(body);
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const result = requestPhoneOtp({ phone: parsed.phone, ip });
    return apiSuccess(result);
  } catch (err) {
    return apiError(err);
  }
}

