import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { logoutUser } from "@/lib/server/auth";

export const POST = handleRoute(async () => {
  await logoutUser();
  return new NextResponse(null, { status: 204 });
});
