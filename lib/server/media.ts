import "server-only";
import { prisma } from "@/lib/db";
import { conflict, notFound, validationError } from "@/lib/api/errors";
import { paginated, type Pagination } from "@/lib/api/handler";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Accepted types, verified against the file's magic bytes (not just the browser-supplied type). SVG is excluded: it can carry scripts. */
const SIGNATURES: { mime: string; test: (bytes: Uint8Array) => boolean }[] = [
  { mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: "image/gif", test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  {
    mime: "image/webp",
    test: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
  {
    mime: "image/avif",
    test: (b) => String.fromCharCode(...b.slice(4, 12)) === "ftypavif",
  },
];

export function mediaUrl(id: string): string {
  return `/media/${id}`;
}

function serializeAsset(asset: { id: string; filename: string; mimeType: string; sizeBytes: number; alt: string; createdAt: Date }) {
  return {
    id: asset.id,
    url: mediaUrl(asset.id),
    filename: asset.filename,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    alt: asset.alt,
    createdAt: asset.createdAt.toISOString(),
  };
}

export async function uploadMediaForOrg(organizationId: string, file: File, alt: string) {
  if (file.size === 0) throw validationError({ file: ["The file is empty"] });
  if (file.size > MAX_UPLOAD_BYTES) throw validationError({ file: ["Images must be 5 MB or smaller"] });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = SIGNATURES.find((signature) => signature.test(bytes));
  if (!detected) throw validationError({ file: ["Only JPG, PNG, WEBP, GIF or AVIF images are allowed"] });

  const asset = await prisma.mediaAsset.create({
    data: {
      organizationId,
      filename: file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "upload",
      mimeType: detected.mime,
      sizeBytes: bytes.byteLength,
      data: bytes,
      alt: alt.slice(0, 200),
    },
    select: { id: true, filename: true, mimeType: true, sizeBytes: true, alt: true, createdAt: true },
  });
  return serializeAsset(asset);
}

export async function listMediaForOrg(organizationId: string, params: Pagination & { search?: string }) {
  const where = {
    organizationId,
    ...(params.search ? { filename: { contains: params.search, mode: "insensitive" as const } } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: { id: true, filename: true, mimeType: true, sizeBytes: true, alt: true, createdAt: true },
    }),
    prisma.mediaAsset.count({ where }),
  ]);
  return paginated(items.map(serializeAsset), total, params);
}

/** Places a media URL can be referenced from. Used to refuse deleting an image that is still in use. */
async function findMediaReferences(organizationId: string, url: string): Promise<string[]> {
  const [images, categories, posts, configs, team, options, pages] = await Promise.all([
    prisma.productImage.count({ where: { url, product: { organizationId } } }),
    prisma.category.count({ where: { organizationId, imageUrl: url } }),
    prisma.blogPost.count({ where: { organizationId, coverImageUrl: url } }),
    prisma.storefrontConfig.count({
      where: { organizationId, OR: [{ logoUrl: url }, { faviconUrl: url }, { heroImageUrl: url }] },
    }),
    prisma.teamMember.count({ where: { organizationId, imageUrl: url } }),
    prisma.outfitOption.count({ where: { organizationId, imageUrl: url } }),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM "page_contents"
      WHERE "organizationId" = ${organizationId} AND "content"::text LIKE ${"%" + url + "%"}`,
  ]);
  const references: string[] = [];
  if (images) references.push(`${images} product image(s)`);
  if (categories) references.push(`${categories} category(ies)`);
  if (posts) references.push(`${posts} blog post(s)`);
  if (configs) references.push("store branding / hero");
  if (team) references.push(`${team} team member(s)`);
  if (options) references.push(`${options} outfit finder option(s)`);
  if (Number(pages[0]?.count ?? 0)) references.push("page content");
  return references;
}

export async function deleteMediaForOrg(organizationId: string, id: string) {
  const asset = await prisma.mediaAsset.findFirst({ where: { id, organizationId }, select: { id: true } });
  if (!asset) throw notFound("Image not found");
  const references = await findMediaReferences(organizationId, mediaUrl(id));
  if (references.length > 0) {
    throw conflict(`This image is still used by ${references.join(", ")}. Replace it there first.`, "MEDIA_IN_USE");
  }
  await prisma.mediaAsset.delete({ where: { id } });
}

export async function getMediaFile(id: string) {
  return prisma.mediaAsset.findUnique({ where: { id }, select: { data: true, mimeType: true, sizeBytes: true } });
}
