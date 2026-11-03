import { NextRequest } from "next/server";
import { requirePlayerOrAdmin } from "@/server/auth/service";
import {
  getEventsFromDb,
  registerForEventInDb,
} from "@/server/services/playcourtService";
import { apiError, apiSuccess } from "@/server/utils/http";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePlayerOrAdmin();
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const event = registerForEventInDb(user, id, body?.partnerName);
    const events = getEventsFromDb(user.id);
    return apiSuccess({ event, events }, 201);
  } catch (err) {
    return apiError(err);
  }
}

