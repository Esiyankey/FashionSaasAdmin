import "server-only";
import { prisma } from "@/lib/db";
import { notFound } from "@/lib/api/errors";
import { PAGE_SCHEMAS, type PageKey } from "@/lib/api/schemas/content";
import { notifyStorefront, StorefrontTag } from "@/lib/server/revalidate";
import { Prisma } from "@/lib/generated/prisma/client";
import type { z } from "zod";
import type { navigationUpdateSchema, teamMemberSchema } from "@/lib/api/schemas/content";

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export async function getNavigationForOrg(organizationId: string) {
  const links = await prisma.navigationLink.findMany({
    where: { organizationId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  const toDto = (link: (typeof links)[number]) => ({
    id: link.id,
    label: link.label,
    href: link.href,
    isVisible: link.isVisible,
    position: link.position,
  });
  return {
    header: links.filter((link) => link.location === "HEADER").map(toDto),
    footer: links.filter((link) => link.location === "FOOTER").map(toDto),
  };
}

/** Replaces both menus atomically; array order becomes display order. */
export async function replaceNavigationForOrg(organizationId: string, input: z.infer<typeof navigationUpdateSchema>) {
  await prisma.$transaction([
    prisma.navigationLink.deleteMany({ where: { organizationId } }),
    prisma.navigationLink.createMany({
      data: [
        ...input.header.map((link, position) => ({ organizationId, location: "HEADER" as const, position, ...link })),
        ...input.footer.map((link, position) => ({ organizationId, location: "FOOTER" as const, position, ...link })),
      ],
    }),
  ]);
  notifyStorefront(organizationId, [StorefrontTag.content]);
  return getNavigationForOrg(organizationId);
}

// ---------------------------------------------------------------------------
// Structured pages (About)
// ---------------------------------------------------------------------------

export function isPageKey(key: string): key is PageKey {
  return key in PAGE_SCHEMAS;
}

export async function getPageForOrg(organizationId: string, key: PageKey) {
  const page = await prisma.pageContent.findUnique({ where: { organizationId_key: { organizationId, key } } });
  return { key, content: page?.content ?? null, updatedAt: page?.updatedAt.toISOString() ?? null };
}

export async function savePageForOrg(organizationId: string, key: PageKey, rawContent: unknown) {
  const content = PAGE_SCHEMAS[key].parse(rawContent) as Prisma.InputJsonValue;
  const page = await prisma.pageContent.upsert({
    where: { organizationId_key: { organizationId, key } },
    update: { content },
    create: { organizationId, key, content },
  });
  notifyStorefront(organizationId, [StorefrontTag.content]);
  return { key, content: page.content, updatedAt: page.updatedAt.toISOString() };
}

// ---------------------------------------------------------------------------
// Team members
// ---------------------------------------------------------------------------

type TeamMemberInput = z.infer<typeof teamMemberSchema>;

function serializeTeamMember(member: Prisma.TeamMemberGetPayload<object>) {
  return {
    id: member.id,
    name: member.name,
    role: member.role,
    imageUrl: member.imageUrl,
    position: member.position,
    isVisible: member.isVisible,
  };
}

export async function listTeamMembersForOrg(organizationId: string) {
  const members = await prisma.teamMember.findMany({
    where: { organizationId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  return members.map(serializeTeamMember);
}

export async function createTeamMemberForOrg(organizationId: string, input: TeamMemberInput) {
  const position = input.position ?? (await prisma.teamMember.count({ where: { organizationId } }));
  const member = await prisma.teamMember.create({
    data: { organizationId, name: input.name, role: input.role ?? "", imageUrl: input.imageUrl ?? null, position, isVisible: input.isVisible ?? true },
  });
  notifyStorefront(organizationId, [StorefrontTag.content]);
  return serializeTeamMember(member);
}

export async function updateTeamMemberForOrg(organizationId: string, id: string, input: Partial<TeamMemberInput>) {
  const existing = await prisma.teamMember.findFirst({ where: { id, organizationId }, select: { id: true } });
  if (!existing) throw notFound("Team member not found");
  const member = await prisma.teamMember.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl ?? null } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
      ...(input.isVisible !== undefined ? { isVisible: input.isVisible } : {}),
    },
  });
  notifyStorefront(organizationId, [StorefrontTag.content]);
  return serializeTeamMember(member);
}

export async function deleteTeamMemberForOrg(organizationId: string, id: string) {
  const result = await prisma.teamMember.deleteMany({ where: { id, organizationId } });
  if (result.count === 0) throw notFound("Team member not found");
  notifyStorefront(organizationId, [StorefrontTag.content]);
}
