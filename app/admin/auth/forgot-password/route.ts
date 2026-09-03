import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/api/handler";
import { requestPasswordReset } from "@/lib/server/auth";

const bodySchema = z.object({ email: z.string().email() });

export const POST = handleRoute(async (request: NextRequest) => {
  const { email } = bodySchema.parse(await request.json());
  await requestPasswordReset(email);
  return new NextResponse(null, { status: 204 });
});
