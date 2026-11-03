import { NextRequest } from "next/server";
import { z } from "zod";
import {
  getGroupMembershipState,
  getMembershipPlansFromDb,
  selectMembershipPlanInDb,
  toggleDailyCreditSimulationInDb,
} from "@/server/services/playcourtService";
import { apiError, apiSuccess } from "@/server/utils/http";

const PatchMembershipSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("select_plan"),
    planId: z.string().min(1),
  }),
  z.object({
    action: z.literal("simulate_credit_toggle"),
  }),
]);

export async function GET() {
  try {
    return apiSuccess({
      plans: getMembershipPlansFromDb(),
      groupMembership: getGroupMembershipState(),
    });
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PatchMembershipSchema.parse(body);

    if (parsed.action === "select_plan") {
      const groupMembership = selectMembershipPlanInDb(parsed.planId);
      return apiSuccess({ groupMembership });
    } else {
      const groupMembership = toggleDailyCreditSimulationInDb();
      return apiSuccess({ groupMembership });
    }
  } catch (err) {
    return apiError(err);
  }
}

