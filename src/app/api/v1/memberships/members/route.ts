import { NextRequest } from "next/server";
import { z } from "zod";
import {
  addGroupMemberAtomic,
  removeGroupMemberFromDb,
} from "@/server/services/playcourtService";
import { apiError, apiSuccess } from "@/server/utils/http";

const AddMemberSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(6),
});

const RemoveMemberSchema = z.object({
  memberId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AddMemberSchema.parse(body);
    const result = await addGroupMemberAtomic(parsed);
    return apiSuccess(result, 201);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({
      memberId: req.nextUrl.searchParams.get("memberId") || "",
    }));
    const parsed = RemoveMemberSchema.parse(body);
    const groupMembership = removeGroupMemberFromDb(parsed.memberId);
    return apiSuccess({ groupMembership });
  } catch (err) {
    return apiError(err);
  }
}

