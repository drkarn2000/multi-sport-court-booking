import { getCurrentUser } from "@/server/auth/service";
import { getEventsFromDb } from "@/server/services/playcourtService";
import { apiError, apiSuccess } from "@/server/utils/http";

export async function GET() {
  try {
    const user = await getCurrentUser({ allowDefaultDemoPlayer: true });
    const events = getEventsFromDb(user?.id);
    return apiSuccess({ events });
  } catch (err) {
    return apiError(err);
  }
}

