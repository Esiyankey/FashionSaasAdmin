"use client";

import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/shared/PageContainer";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ProductForm } from "@/features/products/components/ProductForm/ProductForm";
import { useProduct } from "@/features/products/hooks/useProduct";
import { useUpdateProduct } from "@/features/products/hooks/useUpdateProduct";
import type { ProductFormValues } from "@/features/products/components/ProductForm/schema";
import type { Product } from "@/features/products/types";

function toFormValues(product: Product): ProductFormValues {
  return {
    title: product.title,
    description: product.description,
    vendor: product.vendor,
    productType: product.productType,
    status: product.status,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    costPerItem: product.costPerItem,
    sku: product.sku,
    barcode: product.barcode,
    inventory: product.inventory,
    images: product.images,
    categoryIds: product.categoryIds,
    variantOptionNames: product.variantOptionNames,
    variants: product.variants,
    seo: product.seo,
    shipping: product.shipping,
    isFeatured: product.isFeatured,
  };
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: product, isLoading, isError, refetch } = useProduct(id);
  const updateProduct = useUpdateProduct(id);

  function handleSubmit(values: ProductFormValues) {
    updateProduct.mutate(values, {
      onSuccess: () => router.push("/products"),
    });
  }

  return (
    <PageContainer title={product?.title ?? "Edit product"} description="Update product details, media, and inventory.">
      {isLoading ? (
        <LoadingState rows={6} />
      ) : isError || !product ? (
        <ErrorState title="Product not found" description="This product may have been deleted." onRetry={() => refetch()} />
      ) : (
        <ProductForm
          defaultValues={toFormValues(product)}
          onSubmit={handleSubmit}
          isSubmitting={updateProduct.isPending}
          submitLabel="Save changes"
        />
      )}
    </PageContainer>
  );
}
