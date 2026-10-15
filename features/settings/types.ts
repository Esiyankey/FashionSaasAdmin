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

/** GET/PATCH /admin/storefront-config — store info, contact, branding, announcement bar and hero. */
export interface StorefrontConfig {
  storeName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  siteUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  footerText: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  addressLines: string[];
  workingHours: string | null;
  mapEmbedUrl: string | null;
  socialLinks: Record<string, string> | null;
  heroBadgeText: string | null;
  heroHeadline: string | null;
  heroSubheadline: string | null;
  heroImageUrl: string | null;
  heroImageAlt: string;
  heroCtaLabel: string | null;
  heroCtaHref: string | null;
  featuredCategoryIds: string[];
  announcementEnabled: boolean;
  announcementMessage: string | null;
  announcementHighlight: string | null;
  announcementLinkLabel: string | null;
  announcementLinkHref: string | null;
  announcementShowPhone: boolean;
  updatedAt: string;
}

export type UpdateStorefrontConfigInput = Partial<Omit<StorefrontConfig, "updatedAt" | "featuredCategoryIds">>;
