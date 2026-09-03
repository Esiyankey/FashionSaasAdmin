export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "current-user"] as const,
};

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardKeys.all, "summary"] as const,
};

export const platformKeys = {
  all: ["platform"] as const,
  summary: () => [...platformKeys.all, "summary"] as const,
};

export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
};

export const categoryKeys = {
  all: ["categories"] as const,
  list: () => [...categoryKeys.all, "list"] as const,
};

export const productKeys = {
  all: ["products"] as const,
  list: (params: unknown) => [...productKeys.all, "list", params] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
  stats: () => [...productKeys.all, "stats"] as const,
};

export const organizationKeys = {
  all: ["organizations"] as const,
  list: () => [...organizationKeys.all, "list"] as const,
  detail: (id: string) => [...organizationKeys.all, "detail", id] as const,
};

export const customerKeys = {
  all: ["customers"] as const,
  list: (params: unknown) => [...customerKeys.all, "list", params] as const,
  detail: (id: string) => [...customerKeys.all, "detail", id] as const,
};

export const orderKeys = {
  all: ["orders"] as const,
  list: (params: unknown) => [...orderKeys.all, "list", params] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
};

export const inventoryKeys = {
  all: ["inventory"] as const,
  list: (params: unknown) => [...inventoryKeys.all, "list", params] as const,
};

export const settingsKeys = {
  all: ["settings"] as const,
  detail: () => [...settingsKeys.all, "detail"] as const,
};

export const storefrontConfigKeys = {
  all: ["storefront-config"] as const,
  detail: () => [...storefrontConfigKeys.all, "detail"] as const,
};
