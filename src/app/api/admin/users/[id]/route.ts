import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireAdmin, isAuthError, logSensitiveAction } from "@/lib/api-auth";
import { canChangeUserRole, SUPER_ADMIN_EMAIL } from "@/lib/permissions";
import type { UserRole } from "@prisma/client";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await apiRequireAdmin();
    if (isAuthError(result)) return result;

    const { id } = await params;
    const body = await request.json();
    const { role, isBanned } = body as { role?: string; isBanned?: boolean };

    if (!role && isBanned === undefined) {
      return NextResponse.json({ error: "缺少必要参数 role 或 isBanned" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (id === result.user.id) {
      return NextResponse.json({ error: "不能修改自己的账号" }, { status: 400 });
    }

    // 保护超级管理员：不允许任何人封禁、修改、降级超级管理员
    if (user.role === "SUPER_ADMIN" || user.email === SUPER_ADMIN_EMAIL) {
      await logSensitiveAction(
        result.user.id,
        "ILLEGAL_MODIFICATION_ATTEMPT",
        user.id,
        "USER",
        `尝试修改超级管理员 ${user.email}。操作被拒绝。`
      );
      return NextResponse.json({ error: "不能修改超级管理员" }, { status: 403 });
    }

    // 处理封禁/解封
    if (isBanned !== undefined) {
      const updatedUser = await db.user.update({
        where: { id },
        data: {
          isBanned,
          bannedAt: isBanned ? new Date() : null,
          bannedReason: isBanned ? "管理员操作" : null,
        },
        select: {
          id: true, email: true, username: true, role: true,
          isBanned: true, createdAt: true, updatedAt: true, profile: true,
        },
      });

      await logSensitiveAction(
        result.user.id,
        isBanned ? "USER_BANNED" : "USER_UNBANNED",
        user.id,
        "USER",
        `${isBanned ? "封禁" : "解封"}了用户 ${user.email}`
      );

      if (!role) {
        return NextResponse.json(updatedUser);
      }
    }

    // 处理角色变更
    if (role) {
      const check = canChangeUserRole(
        result.user.role,
        user.role as UserRole,
        role as UserRole,
        user.email
      );

      if (!check.allowed) {
        if (role === "SUPER_ADMIN") {
          await logSensitiveAction(
            result.user.id,
            "ILLEGAL_ROLE_CHANGE_ATTEMPT",
            user.id,
            "USER",
            `尝试将 ${user.email} (${user.role}) 修改为 ${role}。拒绝原因：${check.reason}`
          );
        }
        return NextResponse.json({ error: check.reason }, { status: 403 });
      }

      const updatedUser = await db.user.update({
        where: { id },
        data: { role: role as UserRole },
        select: {
          id: true, email: true, username: true, role: true,
          isBanned: true, createdAt: true, updatedAt: true, profile: true,
        },
      });

      await logSensitiveAction(
        result.user.id,
        "ROLE_CHANGED",
        user.id,
        "USER",
        `将 ${user.email} 的角色从 ${user.role} 修改为 ${role}`
      );

      return NextResponse.json(updatedUser);
    }
  } catch (error) {
    console.error("Failed to update user role:", error);
    return NextResponse.json({ error: "更新用户角色失败" }, { status: 500 });
  }
}
