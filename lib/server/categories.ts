import "server-only";
import { prisma } from "@/lib/db";
import { badRequest, conflict, notFound } from "@/lib/api/errors";
import { slugify } from "@/utils/slugify";

function serializeCategory(category: { id: string; name: string; slug: string; parentId: string | null }) {
  return { id: category.id, name: category.name, slug: category.slug, parentId: category.parentId };
}

async function uniqueCategorySlug(organizationId: string, name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "category";
  let slug = base;
  let suffix = 2;
  // eslint-disable-next-line no-await-in-loop
  while (
    await prisma.category.findFirst({
      where: { organizationId, slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export async function listCategoriesForOrg(organizationId: string) {
  const categories = await prisma.category.findMany({
    where: { organizationId, archivedAt: null },
    orderBy: { name: "asc" },
  });
  return categories.map(serializeCategory);
}

export async function createCategoryForOrg(organizationId: string, input: { name: string; parentId?: string | null }) {
  if (input.parentId) {
    const parent = await prisma.category.findFirst({ where: { id: input.parentId, organizationId } });
    if (!parent) throw badRequest("Parent category does not belong to this organization");
  }
  const slug = await uniqueCategorySlug(organizationId, input.name);
  const category = await prisma.category.create({
    data: { organizationId, name: input.name, slug, parentId: input.parentId || null },
  });
  return serializeCategory(category);
}

export async function updateCategoryForOrg(
  organizationId: string,
  id: string,
  input: { name: string; parentId?: string | null }
) {
  const existing = await prisma.category.findFirst({ where: { id, organizationId } });
  if (!existing) throw notFound("Category not found");
  if (input.parentId === id) throw badRequest("A category cannot be its own parent");
  if (input.parentId) {
    const parent = await prisma.category.findFirst({ where: { id: input.parentId, organizationId } });
    if (!parent) throw badRequest("Parent category does not belong to this organization");
  }
  const slug = await uniqueCategorySlug(organizationId, input.name, id);
  const category = await prisma.category.update({
    where: { id },
    data: { name: input.name, slug, parentId: input.parentId || null },
  });
  return serializeCategory(category);
}

export async function archiveCategoryForOrg(organizationId: string, id: string) {
  const existing = await prisma.category.findFirst({ where: { id, organizationId } });
  if (!existing) throw notFound("Category not found");
  const childCount = await prisma.category.count({ where: { organizationId, parentId: id, archivedAt: null } });
  if (childCount > 0) throw conflict("Archive or reassign this category's subcategories first");
  await prisma.$transaction([
    prisma.productCategory.deleteMany({ where: { categoryId: id } }),
    prisma.category.update({ where: { id }, data: { archivedAt: new Date() } }),
  ]);
}
