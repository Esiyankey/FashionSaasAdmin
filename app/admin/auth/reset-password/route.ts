import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/api/handler";
import { resetPasswordWithToken } from "@/lib/server/auth";

const bodySchema = z.object({ token: z.string().min(1), password: z.string().min(8) });

export const POST = handleRoute(async (request: NextRequest) => {
  const { token, password } = bodySchema.parse(await request.json());
  await resetPasswordWithToken(token, password);
  return new NextResponse(null, { status: 204 });
});
