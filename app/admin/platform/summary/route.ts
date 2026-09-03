import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { getPlatformSummary } from "@/lib/server/platform";

export const GET = handleRoute(async () => {
  await requireSuperAdmin();
  return NextResponse.json(await getPlatformSummary());
});
