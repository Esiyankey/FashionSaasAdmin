export interface BusinessBranding {
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  plan: "starter" | "growth" | "enterprise";
  status: "active" | "suspended";
  branding: BusinessBranding;
}
