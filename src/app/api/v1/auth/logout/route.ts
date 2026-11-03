import { clearSessionCookie } from "@/server/auth/service";
import { apiError, apiSuccess } from "@/server/utils/http";

export async function POST() {
  try {
    await clearSessionCookie();
    return apiSuccess({ loggedOut: true });
  } catch (err) {
    return apiError(err);
  }
}

