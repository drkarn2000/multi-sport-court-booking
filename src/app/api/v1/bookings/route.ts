import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePlayerOrAdmin } from "@/server/auth/service";
import {
  createBookingAtomic,
  getBookingsFromDb,
  getVenuesWithLiveAvailability,
} from "@/server/services/playcourtService";
import { apiError, apiSuccess } from "@/server/utils/http";

const CreateBookingSchema = z.object({
  venueId: z.string().min(1),
  courtId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  timeSlot: z.string().min(1),
  playerName: z.string().min(2).max(100),
  playerEmail: z.string().email(),
  playerPhone: z.string().min(6),
  useGroupCredit: z.boolean().default(false),
  notes: z.string().max(400).optional(),
  paymentOutcome: z.enum(["SUCCESS", "FAILED", "CANCELLED"]).optional(),
  idempotencyKey: z.string().max(120).optional(),
});

export async function GET() {
  try {
    const bookings = getBookingsFromDb();
    return apiSuccess({ bookings });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePlayerOrAdmin();
    const body = await req.json();
    const parsed = CreateBookingSchema.parse(body);

    const { booking, groupMembership, paymentTxCode, duplicateReplay } =
      await createBookingAtomic(user, parsed);
    const venues = getVenuesWithLiveAvailability(parsed.date);

    return apiSuccess(
      {
        booking,
        groupMembership,
        venues,
        paymentTxCode,
        duplicateReplay: Boolean(duplicateReplay),
      },
      duplicateReplay ? 200 : 201
    );
  } catch (err) {
    return apiError(err);
  }
}
