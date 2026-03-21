/**
 * API 路由权限校验工具
 * 所有后台 API 统一使用这些函数进行权限检查
 */

import { NextResponse } from "next/server";
import { auth } from "./auth";
import { db } from "./db";
import { hasAdminAccess, isAdmin, isSuperAdmin, SUPER_ADMIN_EMAIL } from "./permissions";
import type { UserRole } from "@prisma/client";

interface AuthResult {
  user: {
    id: string;
    email: string;
    username: string;
    role: UserRole;
  };
}

type AuthError = NextResponse;

/** 要求用户已登录 */
export async function apiRequireAuth(): Promise<AuthResult | AuthError> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  return { user: session.user as AuthResult["user"] };
}

/** 要求后台访问权限（MODERATOR+） */
export async function apiRequireAdminAccess(): Promise<AuthResult | AuthError> {
  const result = await apiRequireAuth();
  if (result instanceof NextResponse) return result;
  if (!hasAdminAccess(result.user.role)) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }
  return result;
}

/** 要求管理员权限（ADMIN+） */
export async function apiRequireAdmin(): Promise<AuthResult | AuthError> {
  const result = await apiRequireAuth();
  if (result instanceof NextResponse) return result;
  if (!isAdmin(result.user.role)) {
    return NextResponse.json({ error: "只有管理员可以执行此操作" }, { status: 403 });
  }
  return result;
}

/** 要求超级管理员权限 */
export async function apiRequireSuperAdmin(): Promise<AuthResult | AuthError> {
  const result = await apiRequireAuth();
  if (result instanceof NextResponse) return result;
  if (!isSuperAdmin(result.user.role)) {
    return NextResponse.json({ error: "只有超级管理员可以执行此操作" }, { status: 403 });
  }
  return result;
}

/** 检查是否为 NextResponse 错误 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return result instanceof NextResponse;
}

/** 记录高敏感操作的审计日志 */
export async function logSensitiveAction(
  moderatorId: string,
  action: string,
  targetId: string,
  targetType: string,
  detail?: string
) {
  await db.moderationLog.create({
    data: {
      action,
      detail: detail || null,
      targetId,
      targetType,
      moderatorId,
    },
  });
}

/** 检查目标用户是否为超级管理员（通过 ID 或 email） */
export async function isTargetSuperAdmin(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  });
  return user?.role === "SUPER_ADMIN" || user?.email === SUPER_ADMIN_EMAIL;
}
