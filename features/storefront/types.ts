export interface StorefrontOrganization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
}

export interface StorefrontConfig {
  storeName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  heroHeadline: string | null;
  heroSubheadline: string | null;
  heroImageUrl: string | null;
  featuredProductIds: string[];
  featuredCategoryIds: string[];
  footerText: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  socialLinks: Record<string, string> | null;
}

export interface StorefrontHome {
  organization: StorefrontOrganization;
  storefront: StorefrontConfig | null;
}

export interface CheckoutInput {
  customer: { name: string; email: string; phone?: string };
  shippingAddress: { line1: string; city: string; country: string };
  items: Array<{ productId: string; variantId?: string; quantity: number }>;
}

export interface CheckoutResult {
  id: string;
  orderNumber: string;
  total: number;
}
