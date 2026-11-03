import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePlayerOrAdmin } from "@/server/auth/service";
import {
  getBookingsFromDb,
  requestBookingCancellation,
} from "@/server/services/playcourtService";
import { apiError, apiSuccess } from "@/server/utils/http";

const CancelBookingSchema = z.object({
  reason: z.string().max(400).optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePlayerOrAdmin();
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const parsed = CancelBookingSchema.parse(body);

    const booking = requestBookingCancellation(user, id, parsed.reason);
    const bookings = getBookingsFromDb();

    return apiSuccess({ booking, bookings });
  } catch (err) {
    return apiError(err);
  }
}

