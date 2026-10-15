import "server-only";
import { prisma } from "@/lib/db";
import { conflict, notFound, validationError } from "@/lib/api/errors";
import { notifyStorefront, StorefrontTag } from "@/lib/server/revalidate";
import { slugify } from "@/utils/slugify";

export interface CategoryInput {
  name: string;
  slug?: string;
  parentId?: string | null;
  title?: string;
  description?: string;
  imageUrl?: string | null;
  imageAlt?: string;
  position?: number;
  isActive?: boolean;
}

type DbCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  title: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string;
  position: number;
  isActive: boolean;
  updatedAt: Date;
};

function serializeCategory(category: DbCategory, counts?: { total: number; published: number }) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentId: category.parentId,
    title: category.title,
    description: category.description,
    imageUrl: category.imageUrl,
    imageAlt: category.imageAlt,
    position: category.position,
    isActive: category.isActive,
    productCount: counts?.total ?? 0,
    publishedProductCount: counts?.published ?? 0,
    updatedAt: category.updatedAt.toISOString(),
  };
}

async function uniqueCategorySlug(organizationId: string, source: string, excludeId?: string): Promise<string> {
  const base = slugify(source) || "category";
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

/** Names are unique per organization regardless of case ("Women" vs "women"). */
async function assertNameAvailable(organizationId: string, name: string, excludeId?: string) {
  const clash = await prisma.category.findFirst({
    where: {
      organizationId,
      archivedAt: null,
      name: { equals: name.trim(), mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (clash) throw validationError({ name: ["A category with this name already exists"] });
}

async function assertSlugAvailable(organizationId: string, slug: string, excludeId?: string) {
  const clash = await prisma.category.findFirst({
    where: { organizationId, slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  });
  if (clash) throw validationError({ slug: ["This slug is already used by another category"] });
}

async function assertValidParent(organizationId: string, parentId: string | null | undefined, selfId?: string) {
  if (!parentId) return;
  if (parentId === selfId) throw validationError({ parentId: ["A category cannot be its own parent"] });
  const parent = await prisma.category.findFirst({
    where: { id: parentId, organizationId, archivedAt: null },
    select: { parentId: true },
  });
  if (!parent) throw validationError({ parentId: ["Parent category does not exist"] });
  // Two levels max (category → subcategory), which also rules out cycles.
  if (parent.parentId) throw validationError({ parentId: ["Subcategories cannot have their own subcategories"] });
  if (selfId) {
    const children = await prisma.category.count({ where: { parentId: selfId, archivedAt: null } });
    if (children > 0) throw validationError({ parentId: ["A category with subcategories must stay top-level"] });
  }
}

export async function listCategoriesForOrg(organizationId: string) {
  const [categories, links] = await Promise.all([
    prisma.category.findMany({
      where: { organizationId, archivedAt: null },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    }),
    prisma.productCategory.findMany({
      where: { category: { organizationId } },
      select: { categoryId: true, product: { select: { status: true } } },
    }),
  ]);
  const counts = new Map<string, { total: number; published: number }>();
  for (const link of links) {
    const entry = counts.get(link.categoryId) ?? { total: 0, published: 0 };
    entry.total += 1;
    if (link.product.status === "PUBLISHED") entry.published += 1;
    counts.set(link.categoryId, entry);
  }
  return categories.map((category) => serializeCategory(category, counts.get(category.id)));
}

export async function createCategoryForOrg(organizationId: string, input: CategoryInput) {
  await assertNameAvailable(organizationId, input.name);
  await assertValidParent(organizationId, input.parentId);
  let slug: string;
  if (input.slug) {
    slug = input.slug;
    await assertSlugAvailable(organizationId, slug);
  } else {
    slug = await uniqueCategorySlug(organizationId, input.name);
  }
  const category = await prisma.category.create({
    data: {
      organizationId,
      name: input.name.trim(),
      slug,
      parentId: input.parentId || null,
      title: input.title?.trim() ?? "",
      description: input.description?.trim() ?? "",
      imageUrl: input.imageUrl || null,
      imageAlt: input.imageAlt?.trim() ?? "",
      position: input.position ?? 0,
      isActive: input.isActive ?? true,
    },
  });
  notifyStorefront(organizationId, [StorefrontTag.categories, StorefrontTag.products]);
  return serializeCategory(category);
}

export async function updateCategoryForOrg(organizationId: string, id: string, input: Partial<CategoryInput>) {
  const existing = await prisma.category.findFirst({ where: { id, organizationId, archivedAt: null } });
  if (!existing) throw notFound("Category not found");
  if (input.name !== undefined) await assertNameAvailable(organizationId, input.name, id);
  if (input.parentId !== undefined) await assertValidParent(organizationId, input.parentId, id);

  let slug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    await assertSlugAvailable(organizationId, input.slug, id);
    slug = input.slug;
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      slug,
      ...(input.parentId !== undefined ? { parentId: input.parentId || null } : {}),
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl || null } : {}),
      ...(input.imageAlt !== undefined ? { imageAlt: input.imageAlt.trim() } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
  notifyStorefront(organizationId, [StorefrontTag.categories, StorefrontTag.products]);
  return serializeCategory(category);
}

/**
 * Archives (soft-deletes) a category. Refused while products or
 * subcategories still use it, so no product silently loses its category —
 * deactivate it instead to hide it from the storefront.
 */
export async function archiveCategoryForOrg(organizationId: string, id: string) {
  const existing = await prisma.category.findFirst({ where: { id, organizationId, archivedAt: null } });
  if (!existing) throw notFound("Category not found");
  const [childCount, productCount] = await Promise.all([
    prisma.category.count({ where: { organizationId, parentId: id, archivedAt: null } }),
    prisma.productCategory.count({ where: { categoryId: id } }),
  ]);
  if (childCount > 0) throw conflict("Archive or reassign this category's subcategories first");
  if (productCount > 0) {
    throw conflict(
      `${productCount} product(s) are still in this category. Reassign them, or deactivate the category to hide it.`,
      "CATEGORY_IN_USE"
    );
  }
  await prisma.category.update({ where: { id }, data: { archivedAt: new Date(), isActive: false } });
  notifyStorefront(organizationId, [StorefrontTag.categories]);
}
