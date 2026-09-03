import { z } from "zod";

export const productImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  alt: z.string().optional(),
  position: z.number(),
});

export const variantOptionSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
});

export const productVariantSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  options: z.array(variantOptionSchema),
  sku: z.string().optional(),
  price: z.number().min(0).optional(),
  compareAtPrice: z.number().min(0).optional(),
  inventoryQuantity: z.number().min(0),
  imageId: z.string().optional(),
});

export const productFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  vendor: z.string(),
  productType: z.string(),
  status: z.enum(["draft", "published", "archived"]),
  price: z.number().min(0, "Price must be 0 or more"),
  compareAtPrice: z.number().min(0).optional(),
  costPerItem: z.number().min(0).optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  inventory: z.object({
    trackQuantity: z.boolean(),
    quantity: z.number().min(0),
    lowStockThreshold: z.number().min(0),
    allowBackorder: z.boolean(),
  }),
  images: z.array(productImageSchema),
  categoryIds: z.array(z.string()),
  variantOptionNames: z.array(z.string()),
  variants: z.array(productVariantSchema),
  seo: z.object({
    title: z.string(),
    description: z.string(),
  }),
  shipping: z.object({
    weightKg: z.number().min(0).optional(),
    requiresShipping: z.boolean(),
  }),
  isFeatured: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const defaultProductFormValues: ProductFormValues = {
  title: "",
  description: "",
  vendor: "",
  productType: "",
  status: "draft",
  price: 0,
  compareAtPrice: undefined,
  costPerItem: undefined,
  sku: "",
  barcode: "",
  inventory: {
    trackQuantity: true,
    quantity: 0,
    lowStockThreshold: 5,
    allowBackorder: false,
  },
  images: [],
  categoryIds: [],
  variantOptionNames: [],
  variants: [],
  seo: { title: "", description: "" },
  shipping: { weightKg: undefined, requiresShipping: true },
  isFeatured: false,
};
