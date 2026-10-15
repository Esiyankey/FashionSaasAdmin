import "server-only";
import { prisma } from "@/lib/db";
import { notFound } from "@/lib/api/errors";
import { paginated, type Pagination } from "@/lib/api/handler";
import type { ContactMessageStatus, Prisma, SubscriberStatus } from "@/lib/generated/prisma/client";

// ---------------------------------------------------------------------------
// Contact messages
// ---------------------------------------------------------------------------

function serializeMessage(message: Prisma.ContactMessageGetPayload<object>) {
  return {
    id: message.id,
    name: message.name,
    email: message.email,
    phone: message.phone,
    subject: message.subject,
    message: message.message,
    status: message.status,
    internalNote: message.internalNote,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
  };
}

export async function createContactMessage(
  organizationId: string,
  input: { name: string; email: string; phone?: string; subject: string; message: string }
) {
  const message = await prisma.contactMessage.create({ data: { organizationId, ...input } });
  return { id: message.id, createdAt: message.createdAt.toISOString() };
}

export async function listContactMessagesForOrg(
  organizationId: string,
  params: Pagination & { search?: string; status?: ContactMessageStatus | "all" }
) {
  const where: Prisma.ContactMessageWhereInput = {
    organizationId,
    ...(params.status && params.status !== "all" ? { status: params.status } : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { email: { contains: params.search, mode: "insensitive" } },
            { subject: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [items, total, unread] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.count({ where: { organizationId, status: "NEW" } }),
  ]);
  return { ...paginated(items.map(serializeMessage), total, params), unreadCount: unread };
}

/** Opening a NEW message marks it READ. */
export async function getContactMessageForOrg(organizationId: string, id: string, markRead: boolean) {
  const message = await prisma.contactMessage.findFirst({ where: { id, organizationId } });
  if (!message) throw notFound("Message not found");
  if (markRead && message.status === "NEW") {
    return serializeMessage(await prisma.contactMessage.update({ where: { id }, data: { status: "READ" } }));
  }
  return serializeMessage(message);
}

export async function updateContactMessageForOrg(
  organizationId: string,
  id: string,
  input: { status?: ContactMessageStatus; internalNote?: string | null }
) {
  const existing = await prisma.contactMessage.findFirst({ where: { id, organizationId }, select: { id: true } });
  if (!existing) throw notFound("Message not found");
  return serializeMessage(
    await prisma.contactMessage.update({
      where: { id },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.internalNote !== undefined ? { internalNote: input.internalNote || null } : {}),
      },
    })
  );
}

export async function deleteContactMessageForOrg(organizationId: string, id: string) {
  const result = await prisma.contactMessage.deleteMany({ where: { id, organizationId } });
  if (result.count === 0) throw notFound("Message not found");
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------

export type SubscribeOutcome = "subscribed" | "already_subscribed" | "resubscribed";

/** Idempotent: re-submitting an address never errors or creates a duplicate. */
export async function subscribeToNewsletter(
  organizationId: string,
  email: string,
  source: string
): Promise<SubscribeOutcome> {
  const normalized = email.trim().toLowerCase();
  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { organizationId_email: { organizationId, email: normalized } },
  });
  if (existing?.status === "SUBSCRIBED") return "already_subscribed";
  if (existing) {
    await prisma.newsletterSubscriber.update({
      where: { id: existing.id },
      data: { status: "SUBSCRIBED", consentAt: new Date(), unsubscribedAt: null, source },
    });
    return "resubscribed";
  }
  try {
    await prisma.newsletterSubscriber.create({ data: { organizationId, email: normalized, source } });
  } catch (error) {
    // Two concurrent submissions of the same address: the unique index wins, outcome is the same.
    if ((error as { code?: string }).code === "P2002") return "already_subscribed";
    throw error;
  }
  return "subscribed";
}

function serializeSubscriber(subscriber: Prisma.NewsletterSubscriberGetPayload<object>) {
  return {
    id: subscriber.id,
    email: subscriber.email,
    status: subscriber.status,
    source: subscriber.source,
    consentAt: subscriber.consentAt.toISOString(),
    unsubscribedAt: subscriber.unsubscribedAt?.toISOString() ?? null,
    createdAt: subscriber.createdAt.toISOString(),
  };
}

export async function listSubscribersForOrg(
  organizationId: string,
  params: Pagination & { search?: string; status?: SubscriberStatus | "all" }
) {
  const where: Prisma.NewsletterSubscriberWhereInput = {
    organizationId,
    ...(params.status && params.status !== "all" ? { status: params.status } : {}),
    ...(params.search ? { email: { contains: params.search, mode: "insensitive" } } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.newsletterSubscriber.count({ where }),
  ]);
  return paginated(items.map(serializeSubscriber), total, params);
}

export async function setSubscriberStatusForOrg(organizationId: string, id: string, status: SubscriberStatus) {
  const existing = await prisma.newsletterSubscriber.findFirst({ where: { id, organizationId }, select: { id: true } });
  if (!existing) throw notFound("Subscriber not found");
  return serializeSubscriber(
    await prisma.newsletterSubscriber.update({
      where: { id },
      data: status === "UNSUBSCRIBED" ? { status, unsubscribedAt: new Date() } : { status, unsubscribedAt: null },
    })
  );
}

/** Hard delete, for privacy/erasure requests. */
export async function deleteSubscriberForOrg(organizationId: string, id: string) {
  const result = await prisma.newsletterSubscriber.deleteMany({ where: { id, organizationId } });
  if (result.count === 0) throw notFound("Subscriber not found");
}

export async function exportSubscribersCsv(organizationId: string): Promise<string> {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { organizationId, status: "SUBSCRIBED" },
    orderBy: { createdAt: "asc" },
  });
  const escape = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  const rows = subscribers.map((subscriber) =>
    [subscriber.email, subscriber.source, subscriber.consentAt.toISOString(), subscriber.createdAt.toISOString()]
      .map(escape)
      .join(",")
  );
  return ["email,source,consent_at,created_at", ...rows].join("\n") + "\n";
}
