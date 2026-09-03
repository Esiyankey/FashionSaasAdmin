import "server-only";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearSessionCookie, createSessionCookie } from "@/lib/auth/session";
import { badRequest, forbidden, unauthorized } from "@/lib/api/errors";
import type { UserRole } from "@/lib/generated/prisma/client";

function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
}) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: { select: { status: true } } },
  });
  if (!user || user.status !== "ACTIVE") throw unauthorized("Invalid email or password");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw unauthorized("Invalid email or password");

  if (user.role === "ORGANIZATION_ADMIN" && user.organization?.status === "SUSPENDED") {
    throw forbidden("This organization has been suspended");
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSessionCookie({ userId: user.id, role: user.role, organizationId: user.organizationId });
  return serializeUser(user);
}

export async function logoutUser() {
  await clearSessionCookie();
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Always resolves without revealing whether the email exists. */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

  // No email provider is configured yet. Log the link so it's usable in development;
  // wire a real provider (Resend, SES, etc.) here before going to production.
  console.info(
    `[password reset] ${user.email} -> /reset-password?token=${token} (expires ${expiresAt.toISOString()})`
  );
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw badRequest("This reset link is invalid or has expired");
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
}
