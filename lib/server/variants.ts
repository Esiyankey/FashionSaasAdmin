import "server-only";

export interface VariantOptionInput {
  name: string;
  value: string;
}

const SIZE_NAMES = new Set(["size"]);
const COLOR_NAMES = new Set(["color", "colour"]);

/**
 * Normalized identity of a variant's option combination, e.g.
 * `color=black|size=m`. Must stay identical to the SQL backfill in
 * prisma/migrations/20261005160000_storefront_integration.
 */
export function variantOptionKey(options: VariantOptionInput[]): string {
  const parts = options
    .map((option) => ({ name: option.name.trim().toLowerCase(), value: option.value.trim().toLowerCase() }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .map((option) => `${option.name}=${option.value}`);
  return parts.length > 0 ? parts.join("|") : "default";
}

export function deriveSizeAndColor(options: VariantOptionInput[]): { size: string | null; color: string | null } {
  const size = options.find((option) => SIZE_NAMES.has(option.name.trim().toLowerCase()))?.value.trim() || null;
  const color = options.find((option) => COLOR_NAMES.has(option.name.trim().toLowerCase()))?.value.trim() || null;
  return { size, color };
}

export function parseVariantOptions(value: unknown): VariantOptionInput[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is { name: unknown; value: unknown } => typeof entry === "object" && entry !== null)
    .map((entry) => ({ name: String(entry.name ?? ""), value: String(entry.value ?? "") }))
    .filter((entry) => entry.name && entry.value);
}
