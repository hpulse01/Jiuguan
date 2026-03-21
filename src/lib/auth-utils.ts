import { auth } from "./auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { hasAdminAccess, isSuperAdmin, isAdmin } from "./permissions";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireAuth();
  // SUPER_ADMIN has access to everything
  if (isSuperAdmin(user.role)) return user;
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

export async function requireAdminAccess() {
  const user = await requireAuth();
  if (!hasAdminAccess(user.role)) redirect("/");
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (!isAdmin(user.role)) redirect("/");
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireAuth();
  if (!isSuperAdmin(user.role)) redirect("/");
  return user;
}
