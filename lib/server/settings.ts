import "server-only";
import { prisma } from "@/lib/db";
import { notFound } from "@/lib/api/errors";
import { notifyStorefront, StorefrontTag } from "@/lib/server/revalidate";

function serialize(settings: {
  currency: string;
  timezone: string;
  taxRatePercent: number;
  shippingFlatRate: number;
  freeShippingThreshold: number | null;
  orderNumberPrefix: string;
  lowStockThresholdDefault: number;
  updatedAt: Date;
}) {
  return { ...settings, updatedAt: settings.updatedAt.toISOString() };
}

export async function getSettingsForOrg(organizationId: string) {
  const settings = await prisma.organizationSettings.findUnique({ where: { organizationId } });
  if (!settings) throw notFound("Settings not found");
  return serialize(settings);
}

export interface UpdateSettingsInput {
  currency?: string;
  timezone?: string;
  taxRatePercent?: number;
  shippingFlatRate?: number;
  freeShippingThreshold?: number | null;
  orderNumberPrefix?: string;
  lowStockThresholdDefault?: number;
}

export async function updateSettingsForOrg(organizationId: string, input: UpdateSettingsInput) {
  const settings = await prisma.organizationSettings.update({ where: { organizationId }, data: input });
  // Currency, tax and shipping are shown on the storefront (prices, cart estimate).
  notifyStorefront(organizationId, [StorefrontTag.settings, StorefrontTag.content, StorefrontTag.products]);
  return serialize(settings);
}
