import { NextRequest } from "next/server";
import { z } from "zod";
import { processSimulatedPaymentWebhook } from "@/server/services/playcourtService";
import { apiError, apiSuccess } from "@/server/utils/http";

const WebhookSchema = z.object({
  idempotencyKey: z.string().min(3),
  txCode: z.string().optional(),
  customerName: z.string().min(2).default("Aarav Mehta"),
  amountInr: z.number().int().min(1).default(850),
  status: z.enum(["Paid", "Failed"]).default("Paid"),
  bookingId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = WebhookSchema.parse(body);
    const result = processSimulatedPaymentWebhook(parsed);
    return apiSuccess(result, result.duplicate ? 200 : 201);
  } catch (err) {
    return apiError(err);
  }
}

