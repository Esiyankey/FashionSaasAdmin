import { z } from "zod";

/**
 * Shared by the admin form (client-side validation) and the
 * /admin/products API (authoritative server-side validation).
 */

const imageUrl = z
  .string()
  .trim()
  .min(1)
  .max(1000)
  .refine(
    (value) => /^\/(?!\/)[^\s\\]*$/.test(value) || /^https?:\/\/[^\s]+$/i.test(value),
    "Upload the image first — local or temporary (blob:) URLs cannot be saved"
  );

export const productImageSchema = z.object({
  id: z.string(),
  url: imageUrl,
  alt: z.string().max(200).optional(),
  position: z.number().int().min(0),
});

export const variantOptionSchema = z.object({
  name: z.string().trim().min(1).max(40),
  value: z.string().trim().min(1).max(60),
});

export const productVariantSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1).max(120),
  options: z.array(variantOptionSchema).max(3),
  sku: z.string().trim().max(64).optional(),
  price: z.number().min(0).max(1_000_000).optional(),
  compareAtPrice: z.number().min(0).max(1_000_000).optional(),
  inventoryQuantity: z.number().int("Stock must be a whole number").min(0),
  isActive: z.boolean().optional(),
  imageId: z.string().optional(),
});

export const productFormSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    description: z.string().max(10_000),
    summary: z.string().max(300),
    features: z.array(z.string().trim().min(1).max(200)).max(20),
    vendor: z.string().max(80),
    productType: z.string().max(60),
    status: z.enum(["draft", "published", "archived"]),
    price: z.number().min(0, "Price must be 0 or more").max(1_000_000),
    compareAtPrice: z.number().min(0).max(1_000_000).optional(),
    costPerItem: z.number().min(0).max(1_000_000).optional(),
    sku: z.string().trim().max(64).optional(),
    barcode: z.string().trim().max(64).optional(),
    inventory: z.object({
      trackQuantity: z.boolean(),
      quantity: z.number().int("Stock must be a whole number").min(0),
      lowStockThreshold: z.number().int().min(0),
      allowBackorder: z.boolean(),
    }),
    images: z.array(productImageSchema).max(20),
    categoryIds: z.array(z.string()).max(20),
    variantOptionNames: z.array(z.string().trim().min(1).max(40)).max(3),
    variants: z.array(productVariantSchema).max(200),
    seo: z.object({
      title: z.string().max(70),
      description: z.string().max(320),
    }),
    shipping: z.object({
      weightKg: z.number().min(0).optional(),
      requiresShipping: z.boolean(),
    }),
    isFeatured: z.boolean(),
    featuredPosition: z.number().int().min(0).max(10_000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.compareAtPrice !== undefined && value.compareAtPrice > 0 && value.compareAtPrice <= value.price) {
      ctx.addIssue({
        code: "custom",
        path: ["compareAtPrice"],
        message: "Compare-at price must be higher than the price (leave empty for no sale)",
      });
    }
    if (value.status === "published") {
      if (value.price <= 0) ctx.addIssue({ code: "custom", path: ["price"], message: "Set a price before publishing" });
      if (value.images.length === 0) {
        ctx.addIssue({ code: "custom", path: ["images"], message: "Add at least one image before publishing" });
      }
    }
    const keys = new Set<string>();
    value.variants.forEach((variant, index) => {
      const key = variant.options
        .map((option) => `${option.name.trim().toLowerCase()}=${option.value.trim().toLowerCase()}`)
        .sort()
        .join("|");
      if (keys.has(key)) {
        ctx.addIssue({ code: "custom", path: ["variants", index, "title"], message: "Duplicate variant combination" });
      }
      keys.add(key);
    });
    const skus = [value.sku, ...value.variants.map((variant) => variant.sku)]
      .map((sku) => sku?.trim().toLowerCase())
      .filter(Boolean);
    if (new Set(skus).size !== skus.length) {
      ctx.addIssue({ code: "custom", path: ["variants"], message: "Each SKU must be unique" });
    }
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const defaultProductFormValues: ProductFormValues = {
  title: "",
  description: "",
  summary: "",
  features: [],
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
  featuredPosition: undefined,
};
