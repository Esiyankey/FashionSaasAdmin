/**
 * Public storefront API contract (GET/POST /storefront/{orgSlug}/...).
 * Mirrors lib/api/serializers/public.ts and lib/server/storefront.ts.
 * See docs/INTEGRATION.md for the full reference.
 */

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PublicCategoryRef {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
}

export interface PublicVariant {
  id: string;
  title: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  options: { name: string; value: string }[];
  price: number;
  compareAtPrice: number | null;
  discount: number;
  available: boolean;
  imageId: string | null;
}

export interface PublicProduct {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  features: string[];
  productType: string;
  vendor: string;
  category: PublicCategoryRef | null;
  categories: PublicCategoryRef[];
  price: number;
  compareAtPrice: number | null;
  discount: number;
  currency: string;
  image: string | null;
  gallery: string[];
  images: { id: string; url: string; alt: string; position: number }[];
  availableSizes: string[];
  availableColors: string[];
  variantOptionNames: string[];
  variants: PublicVariant[];
  inStock: boolean;
  isFeatured: boolean;
  rating: number | null;
  seo: { title: string; description: string };
  publishedAt: string | null;
  updatedAt: string;
}

export interface StorefrontHome {
  store: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    fontFamily: string | null;
    siteUrl: string | null;
    footerText: string | null;
    seo: { title: string; description: string };
  };
  contact: {
    email: string | null;
    phone: string | null;
    addressLines: string[];
    workingHours: string | null;
    mapEmbedUrl: string | null;
  };
  socialLinks: { platform: string; url: string }[];
  announcement: {
    message: string;
    highlight: string | null;
    linkLabel: string | null;
    linkHref: string | null;
    showPhone: boolean;
  } | null;
  hero: {
    badgeText: string | null;
    headline: string;
    subheadline: string | null;
    imageUrl: string | null;
    imageAlt: string;
    ctaLabel: string | null;
    ctaHref: string | null;
  } | null;
  navigation: { header: { label: string; href: string }[]; footer: { label: string; href: string }[] };
  commerce: { currency: string; taxRatePercent: number; shippingFlatRate: number; freeShippingThreshold: number | null };
  updatedAt: string;
}

export interface CheckoutAddress {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

export interface CheckoutInput {
  shippingAddress: CheckoutAddress;
  items: Array<{ productId: string; variantId?: string; size?: string; color?: string; quantity: number }>;
  paymentMethod?: "cod" | "card" | "wallet";
  note?: string;
}

export interface CheckoutResult {
  id: string;
  orderNumber: string;
  accessToken: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
}
