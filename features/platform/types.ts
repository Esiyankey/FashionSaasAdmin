export interface PlatformTotals {
  organizations: number;
  activeOrganizations: number;
  suspendedOrganizations: number;
  organizationAdmins: number;
  orders: number;
  customers: number;
  revenue: number;
}

export interface RecentOrganizationSummary {
  id: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
}

export interface PlatformSummary {
  totals: PlatformTotals;
  recentOrganizations: RecentOrganizationSummary[];
}
