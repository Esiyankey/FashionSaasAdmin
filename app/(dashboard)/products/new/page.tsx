"use client";

import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/shared/PageContainer";
import { ProductForm } from "@/features/products/components/ProductForm/ProductForm";
import { useCreateProduct } from "@/features/products/hooks/useCreateProduct";
import type { ProductFormValues } from "@/features/products/components/ProductForm/schema";

export default function NewProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();

  function handleSubmit(values: ProductFormValues) {
    createProduct.mutate(values, {
      onSuccess: (product) => router.push(`/products/${product.id}`),
    });
  }

  return (
    <PageContainer title="Add product" description="Create a new product in your catalog.">
      <ProductForm onSubmit={handleSubmit} isSubmitting={createProduct.isPending} submitLabel="Create product" />
    </PageContainer>
  );
}
