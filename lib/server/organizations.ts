import "server-only";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { conflict, notFound } from "@/lib/api/errors";
import { slugify } from "@/utils/slugify";
import type { Prisma } from "@/lib/generated/prisma/client";

async function uniqueOrgSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "organization";
  let slug = base;
  let suffix = 2;
  // eslint-disable-next-line no-await-in-loop
  while (
    await prisma.organization.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

const LIST_INCLUDE = {
  admin: { select: { id: true, name: true, email: true, status: true, lastLoginAt: true } },
  _count: { select: { products: true, orders: true, customers: true } },
} satisfies Prisma.OrganizationInclude;

type OrgWithAdmin = Prisma.OrganizationGetPayload<{ include: typeof LIST_INCLUDE }>;

function serializeOrganization(org: OrgWithAdmin) {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    description: org.description,
    logoUrl: org.logoUrl,
    contactEmail: org.contactEmail,
    contactPhone: org.contactPhone,
    address: org.address,
    status: org.status,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
    admin: org.admin,
    counts: org._count,
  };
}

export async function listOrganizations() {
  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: LIST_INCLUDE,
  });
  return organizations.map(serializeOrganization);
}

export async function getOrganizationDetail(id: string) {
  const organization = await prisma.organization.findUnique({ where: { id }, include: LIST_INCLUDE });
  if (!organization) throw notFound("Organization not found");
  return serializeOrganization(organization);
}

export interface CreateOrganizationInput {
  name: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  logoUrl?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export async function createOrganizationWithAdmin(input: CreateOrganizationInput) {
  const existingAdmin = await prisma.user.findUnique({ where: { email: input.adminEmail } });
  if (existingAdmin) throw conflict("A user with this email already exists");

  const slug = await uniqueOrgSlug(input.name);
  const passwordHash = await hashPassword(input.adminPassword);

  const organization = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: input.name,
        slug,
        description: input.description || null,
        contactEmail: input.contactEmail || null,
        contactPhone: input.contactPhone || null,
        address: input.address || null,
        logoUrl: input.logoUrl || null,
      },
    });
    await tx.user.create({
      data: {
        organizationId: org.id,
        name: input.adminName,
        email: input.adminEmail,
        passwordHash,
        role: "ORGANIZATION_ADMIN",
      },
    });
    await tx.organizationSettings.create({ data: { organizationId: org.id } });
    await tx.storefrontConfig.create({ data: { organizationId: org.id, storeName: input.name } });
    return org;
  });

  return getOrganizationDetail(organization.id);
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
}

export async function updateOrganization(id: string, input: UpdateOrganizationInput) {
  const existing = await prisma.organization.findUnique({ where: { id } });
  if (!existing) throw notFound("Organization not found");
  await prisma.organization.update({ where: { id }, data: input });
  return getOrganizationDetail(id);
}

export async function setOrganizationStatus(id: string, status: "ACTIVE" | "SUSPENDED") {
  const existing = await prisma.organization.findUnique({ where: { id } });
  if (!existing) throw notFound("Organization not found");
  await prisma.organization.update({ where: { id }, data: { status } });
  return getOrganizationDetail(id);
}
