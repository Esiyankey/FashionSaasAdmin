import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute, parsePagination } from "@/lib/api/handler";
import { validationError } from "@/lib/api/errors";
import { listMediaForOrg, uploadMediaForOrg } from "@/lib/server/media";

export const GET = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const params = request.nextUrl.searchParams;
  return NextResponse.json(
    await listMediaForOrg(organizationId, { search: params.get("search")?.trim() || undefined, ...parsePagination(params, 40) })
  );
});

/** multipart/form-data with `file` (image) and optional `alt`. Returns `{ id, url, ... }`; `url` is `/media/{id}`. */
export const POST = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw validationError({ file: ["Attach an image in the `file` field"] });
  const alt = typeof form?.get("alt") === "string" ? String(form?.get("alt")) : "";
  return NextResponse.json(await uploadMediaForOrg(organizationId, file, alt), { status: 201 });
});
