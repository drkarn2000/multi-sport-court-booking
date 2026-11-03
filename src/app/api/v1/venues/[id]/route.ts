import { NextRequest } from "next/server";
import {
  getGroupMembershipState,
  getVenuesWithLiveAvailability,
} from "@/server/services/playcourtService";
import { AppError, apiError, apiSuccess } from "@/server/utils/http";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const date = req.nextUrl.searchParams.get("date") || undefined;
    const venues = getVenuesWithLiveAvailability(date);
    const venue = venues.find((v) => v.id === id || v.slug === id);

    if (!venue) {
      throw new AppError("NOT_FOUND", `Venue '${id}' not found.`, 404);
    }

    const groupMembership = getGroupMembershipState();
    const creditEligibleToday =
      venue.participatingInCredits &&
      groupMembership.status === "Active" &&
      groupMembership.dailyCreditUsed < groupMembership.dailyCreditTotal;

    return apiSuccess({
      venue,
      creditEligibleToday,
      groupMembership,
    });
  } catch (err) {
    return apiError(err);
  }
}

