import { NextRequest } from "next/server";
import { resolveUserSession } from "@/server/auth/service";
import { resetAndReseedDatabase } from "@/server/db";
import { getBootstrapState } from "@/server/services/playcourtService";
import { assertLocalDevEnvironment } from "@/server/utils/env";
import { apiError, apiSuccess } from "@/server/utils/http";

export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get("date") || undefined;
    const sessionRes = await resolveUserSession({ allowDefaultDemoPlayer: true });
    const state = getBootstrapState(sessionRes.user, date, sessionRes.sessionState);
    return apiSuccess(state);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE() {
  try {
    assertLocalDevEnvironment("Demo database reset");
    resetAndReseedDatabase();
    const sessionRes = await resolveUserSession({ allowDefaultDemoPlayer: true });
    const state = getBootstrapState(sessionRes.user, undefined, sessionRes.sessionState);
    return apiSuccess({ reset: true, state });
  } catch (err) {
    return apiError(err);
  }
}
