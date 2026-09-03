export interface OrganizationSettings {
  currency: string;
  timezone: string;
  taxRatePercent: number;
  shippingFlatRate: number;
  freeShippingThreshold: number | null;
  orderNumberPrefix: string;
  lowStockThresholdDefault: number;
  updatedAt: string;
}

export type UpdateOrganizationSettingsInput = Partial<
  Omit<OrganizationSettings, "updatedAt">
>;

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
  updatedAt: string;
}

export type UpdateStorefrontConfigInput = Partial<Omit<StorefrontConfig, "updatedAt">>;
