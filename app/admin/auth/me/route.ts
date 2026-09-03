import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { unauthorized } from "@/lib/api/errors";
import { getCurrentUser } from "@/lib/auth/dal";

export const GET = handleRoute(async () => {
  const user = await getCurrentUser();
  if (!user) throw unauthorized();
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  });
});
