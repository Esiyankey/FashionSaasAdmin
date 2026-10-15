import type { NextRequest } from "next/server";
import { handleRoute } from "@/lib/api/handler";
import { notFound } from "@/lib/api/errors";
import { getMediaFile } from "@/lib/server/media";

/**
 * Public image delivery for uploaded media. Asset ids never change content,
 * so responses are cacheable forever by browsers and CDNs.
 */
export const GET = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/media/[id]">) => {
  const { id } = await ctx.params;
  const file = await getMediaFile(id);
  if (!file) throw notFound("Image not found");
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.sizeBytes),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
});
