import { resolveUserSession } from "@/server/auth/service";
import { getPlayerProfileFromDb } from "@/server/services/playcourtService";
import { isLocalDevEnvironment } from "@/server/utils/env";
import { apiError, apiSuccess } from "@/server/utils/http";

export async function GET() {
  try {
    const strictRes = await resolveUserSession({ allowDefaultDemoPlayer: false });
    const fullRes =
      strictRes.user
        ? strictRes
        : await resolveUserSession({ allowDefaultDemoPlayer: true });

    return apiSuccess({
      user: fullRes.user,
      strictAdminSessionUser: strictRes.user,
      sessionState: fullRes.sessionState,
      isAuthenticated: Boolean(fullRes.user),
      localDevMode: isLocalDevEnvironment(),
      profile: fullRes.user ? getPlayerProfileFromDb(fullRes.user.id) : null,
    });
  } catch (err) {
    return apiError(err);
  }
}
