import { handleRoute } from "@/lib/api/handler";
import { requireOrgAdmin } from "@/lib/auth/dal";
import { exportSubscribersCsv } from "@/lib/server/inbox";

/** CSV of active subscribers, for import into an email tool. */
export const GET = handleRoute(async () => {
  const { organizationId } = await requireOrgAdmin();
  const csv = await exportSubscribersCsv(organizationId);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
