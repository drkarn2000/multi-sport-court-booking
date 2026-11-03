import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser, requirePlayerOrAdmin } from "@/server/auth/service";
import {
  createOpenMatchInDb,
  getOpenMatchesFromDb,
} from "@/server/services/playcourtService";
import { apiError, apiSuccess } from "@/server/utils/http";

const CreateMatchSchema = z.object({
  title: z.string().min(3).max(120),
  sport: z.enum(["Tennis", "Padel", "Badminton", "Squash"]),
  skillLevel: z.enum(["Beginner", "Intermediate", "Advanced"]),
  venueName: z.string().min(1),
  area: z.string().min(1),
  dateTime: z.string().min(1),
  totalSpots: z.number().int().min(2).max(12),
  pricePerPlayer: z.number().int().min(0),
  description: z.string().min(1),
});

export async function GET() {
  try {
    const user = await getCurrentUser({ allowDefaultDemoPlayer: true });
    const matches = getOpenMatchesFromDb(user?.id);
    return apiSuccess({ matches });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePlayerOrAdmin();
    const body = await req.json();
    const parsed = CreateMatchSchema.parse(body);
    const match = createOpenMatchInDb(user, parsed);
    const matches = getOpenMatchesFromDb(user.id);
    return apiSuccess({ match, matches }, 201);
  } catch (err) {
    return apiError(err);
  }
}

