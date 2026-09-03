import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { handleRoute } from "@/lib/api/handler";
import { loginUser } from "@/lib/server/auth";

const bodySchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const POST = handleRoute(async (request: NextRequest) => {
  const { email, password } = bodySchema.parse(await request.json());
  const user = await loginUser(email, password);
  return NextResponse.json({ user });
});
