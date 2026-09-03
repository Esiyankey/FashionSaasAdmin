# Inventory (Phase 2)

Not implemented yet. Owns stock levels, low-stock thresholds, and stock adjustments per
product/variant. Follow the `components/ hooks/ services/ types.ts` shape used by
`features/dashboard`. The `features/notifications` mock service already seeds a "low stock"
notification — once this module exists, that notification should be produced by a real inventory
event instead of being hardcoded.
