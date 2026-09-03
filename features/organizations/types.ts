export type OrganizationStatus = "ACTIVE" | "SUSPENDED";

export interface OrganizationAdminSummary {
  id: string;
  name: string;
  email: string;
  status: string;
  lastLoginAt: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
  admin: OrganizationAdminSummary | null;
  counts: { products: number; orders: number; customers: number };
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

export interface UpdateOrganizationInput {
  name?: string;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
}
