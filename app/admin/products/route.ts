import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { PRODUCT_INCLUDE, serializeProduct, statusToDb } from "@/lib/api/serializers/product";
import { createProductForOrg } from "@/lib/server/products";
import { productFormSchema } from "@/features/products/components/ProductForm/schema";
import type { Prisma } from "@/lib/generated/prisma/client";

export const GET = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const params = request.nextUrl.searchParams;

  const search = params.get("search")?.trim() ?? "";
  const statusParam = params.get("status") ?? "all";
  const categoryId = params.get("categoryId") ?? "all";
  const sortBy = params.get("sortBy") ?? "updatedAt";
  const sortDirection = params.get("sortDirection") === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize")) || 20));

  const where: Prisma.ProductWhereInput = {
    organizationId,
    ...(statusParam !== "all" ? { status: statusToDb(statusParam as "draft" | "published" | "archived") } : {}),
    ...(categoryId !== "all" ? { categories: { some: { categoryId } } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
            { productType: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sortBy === "title"
      ? { title: sortDirection }
      : sortBy === "status"
        ? { status: sortDirection }
        : sortBy === "price"
          ? { price: sortDirection }
          : sortBy === "inventory"
            ? { quantity: sortDirection }
            : { updatedAt: sortDirection };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ items: items.map(serializeProduct), total });
});

export const POST = handleRoute(async (request: NextRequest) => {
  const { organizationId } = await requireOrgAdmin();
  const input = productFormSchema.parse(await request.json());
  const product = await createProductForOrg(organizationId, input);
  return NextResponse.json(product, { status: 201 });
});
