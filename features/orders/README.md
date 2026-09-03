# Orders (Phase 2)

Not implemented yet. Owns order management, fulfillment status, and refunds. Follow the
`components/ hooks/ services/ types.ts` shape used by `features/dashboard`.
`features/dashboard/components/RecentOrdersWidget.tsx` already renders an order shape
(`RecentOrderSummary`) using mock data from `features/dashboard/services/dashboard.service.ts` —
once this module's real `Order` type and service exist, point the dashboard widget at the real
`getRecentOrders()` call instead of the dashboard-local mock.
