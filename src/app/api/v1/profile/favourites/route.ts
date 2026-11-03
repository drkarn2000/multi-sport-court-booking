import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePlayerOrAdmin } from "@/server/auth/service";
import { toggleFavouriteVenueInDb } from "@/server/services/playcourtService";
import { apiError, apiSuccess } from "@/server/utils/http";

const ToggleFavSchema = z.object({
  venueId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requirePlayerOrAdmin();
    const body = await req.json();
    const parsed = ToggleFavSchema.parse(body);
    const result = toggleFavouriteVenueInDb(user, parsed.venueId);
    return apiSuccess(result);
  } catch (err) {
    return apiError(err);
  }
}

