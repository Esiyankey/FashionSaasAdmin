import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { handleRoute } from "@/lib/api/handler";
import { notFound } from "@/lib/api/errors";
import { PRODUCT_INCLUDE, serializeProduct } from "@/lib/api/serializers/product";
import { deleteProductsForOrg, updateProductForOrg } from "@/lib/server/products";
import { productFormSchema } from "@/features/products/components/ProductForm/schema";

export const GET = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/admin/products/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  const product = await prisma.product.findFirst({ where: { id, organizationId }, include: PRODUCT_INCLUDE });
  if (!product) throw notFound("Product not found");
  return NextResponse.json(serializeProduct(product));
});

export const PATCH = handleRoute(async (request: NextRequest, ctx: RouteContext<"/admin/products/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  const input = productFormSchema.parse(await request.json());
  const product = await updateProductForOrg(organizationId, id, input);
  return NextResponse.json(product);
});

export const DELETE = handleRoute(async (_request: NextRequest, ctx: RouteContext<"/admin/products/[id]">) => {
  const { organizationId } = await requireOrgAdmin();
  const { id } = await ctx.params;
  await deleteProductsForOrg(organizationId, [id]);
  return new NextResponse(null, { status: 204 });
});
