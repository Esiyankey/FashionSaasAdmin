import "server-only";
import { cache } from "react";
import type { UserRole } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { forbidden, unauthorized } from "@/lib/api/errors";
import { getSessionFromCookies, type SessionPayload } from "./session";

/** Optimistic session read from the signed cookie. Memoized per request. */
export const getSession = cache(async (): Promise<SessionPayload | null> => getSessionFromCookies());

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw unauthorized();
  return session;
}

export async function requireSuperAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "SUPER_ADMIN") throw forbidden("Super admin access required");
  return session;
}

/**
 * Verifies the caller is an active ORGANIZATION_ADMIN and returns their
 * organizationId. This is the only source of truth for tenant scoping —
 * route handlers must use the returned organizationId, never one supplied
 * by the client (body/query/params).
 */
export async function requireOrgAdmin(): Promise<{ userId: string; organizationId: string }> {
  const session = await requireSession();
  if (session.role !== "ORGANIZATION_ADMIN" || !session.organizationId) {
    throw forbidden("Organization admin access required");
  }
  const organization = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { status: true },
  });
  if (!organization || organization.status === "SUSPENDED") {
    throw forbidden("This organization is suspended");
  }
  return { userId: session.userId, organizationId: session.organizationId };
}

/** Either role, for endpoints readable by both (e.g. /api/auth/me). */
export async function requireAdmin(): Promise<{ userId: string; role: UserRole; organizationId: string | null }> {
  const session = await requireSession();
  return { userId: session.userId, role: session.role, organizationId: session.organizationId };
}

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      organizationId: true,
      organization: { select: { id: true, name: true, slug: true, status: true, logoUrl: true } },
    },
  });
});
