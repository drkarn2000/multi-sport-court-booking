import { NextRequest } from "next/server";
import { requirePlayerOrAdmin } from "@/server/auth/service";
import {
  getOpenMatchesFromDb,
  toggleJoinOpenMatchInDb,
} from "@/server/services/playcourtService";
import { apiError, apiSuccess } from "@/server/utils/http";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePlayerOrAdmin();
    const { id } = await context.params;
    const { match, joined } = toggleJoinOpenMatchInDb(user, id);
    const matches = getOpenMatchesFromDb(user.id);
    return apiSuccess({ match, joined, matches });
  } catch (err) {
    return apiError(err);
  }
}

