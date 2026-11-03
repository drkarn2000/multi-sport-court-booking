import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN_ROLE"
  | "FORBIDDEN_IN_PRODUCTION"
  | "NOT_FOUND"
  | "SLOT_ALREADY_BOOKED"
  | "SLOT_UNDER_MAINTENANCE"
  | "GROUP_DAILY_CREDIT_ALREADY_USED"
  | "GROUP_MEMBER_LIMIT_REACHED"
  | "VENUE_NOT_CREDIT_ELIGIBLE"
  | "GROUP_CREDIT_LOCKED"
  | "PAYMENT_FAILED"
  | "PAYMENT_CANCELLED"
  | "MATCH_FULL"
  | "EVENT_FULL"
  | "OTP_EXPIRED_OR_INVALID"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  code: ApiErrorCode;
  status: number;
  details?: Record<string, unknown>;

  constructor(
    code: ApiErrorCode,
    message: string,
    status: number = 400,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, success: true, data }, { status });
}

export function apiError(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
      },
      { status: err.status }
    );
  }

  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".") || "root";
      fieldErrors[path] = fieldErrors[path] || [];
      fieldErrors[path].push(issue.message);
    }
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: {
          code: "VALIDATION_ERROR" as ApiErrorCode,
          message: err.issues[0]?.message || "Invalid request payload",
          fieldErrors,
        },
      },
      { status: 422 }
    );
  }

  console.error("[API Unhandled Error]:", err);
  return NextResponse.json(
    {
      ok: false,
      success: false,
      error: {
        code: "INTERNAL_ERROR" as ApiErrorCode,
        message:
          err instanceof Error
            ? err.message
            : "An unexpected server error occurred",
      },
    },
    { status: 500 }
  );
}

/**
 * Returns today's date string (YYYY-MM-DD) in Asia/Kolkata timezone.
 */
export function getTodayIstDate(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIMEZONE || "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}
