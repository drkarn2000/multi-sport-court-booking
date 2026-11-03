import { NextRequest } from "next/server";
import { requirePlayerOrAdmin } from "@/server/auth/service";
import {
  getPlayerProfileFromDb,
  updatePlayerProfileInDb,
} from "@/server/services/playcourtService";
import { apiError, apiSuccess } from "@/server/utils/http";

export async function GET() {
  try {
    const user = await requirePlayerOrAdmin();
    const profile = getPlayerProfileFromDb(user.id);
    return apiSuccess({ profile });
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requirePlayerOrAdmin();
    const body = await req.json();
    const profile = updatePlayerProfileInDb(user, body);
    return apiSuccess({ profile });
  } catch (err) {
    return apiError(err);
  }
}

