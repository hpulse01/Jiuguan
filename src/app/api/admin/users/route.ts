import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireAdminAccess, apiRequireAdmin, isAuthError, logSensitiveAction } from "@/lib/api-auth";
import { canChangeUserRole, SUPER_ADMIN_EMAIL, getAssignableRoles } from "@/lib/permissions";
import type { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const result = await apiRequireAdminAccess();
    if (isAuthError(result)) return result;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
    const skip = (page - 1) * pageSize;
    const search = searchParams.get("search") || undefined;
    const roleFilter = searchParams.get("role") || undefined;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { profile: { nickname: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (roleFilter) {
      where.role = roleFilter;
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isBanned: true,
          bannedAt: true,
          bannedReason: true,
          createdAt: true,
          updatedAt: true,
          profile: true,
          _count: {
            select: {
              cases: true,
              comments: true,
              reports: true,
            },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      assignableRoles: getAssignableRoles(result.user.role),
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const result = await apiRequireAdmin();
    if (isAuthError(result)) return result;

    const body = await request.json();
    const { userId, role, action, reason } = body as {
      userId: string;
      role?: string;
      action?: "ban" | "unban";
      reason?: string;
    };

    if (!userId) {
      return NextResponse.json({ error: "缺少用户 ID" }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (userId === result.user.id) {
      return NextResponse.json({ error: "不能修改自己的角色或状态" }, { status: 400 });
    }

    // 封禁/解封操作
    if (action === "ban" || action === "unban") {
      if (targetUser.role === "SUPER_ADMIN" || targetUser.email === SUPER_ADMIN_EMAIL) {
        await logSensitiveAction(
          result.user.id,
          "ILLEGAL_BAN_ATTEMPT",
          targetUser.id,
          "USER",
          `尝试${action === "ban" ? "封禁" : "解封"}超级管理员 ${targetUser.email}`
        );
        return NextResponse.json({ error: "不能封禁超级管理员" }, { status: 403 });
      }

      if (result.user.role === "ADMIN" && targetUser.role === "ADMIN") {
        return NextResponse.json({ error: "管理员不能封禁其他管理员" }, { status: 403 });
      }

      const updatedUser = await db.user.update({
        where: { id: userId },
        data: {
          isBanned: action === "ban",
          bannedAt: action === "ban" ? new Date() : null,
          bannedReason: action === "ban" ? (reason || "违反社区规定") : null,
        },
        select: {
          id: true, email: true, username: true, role: true,
          isBanned: true, bannedAt: true, bannedReason: true,
          createdAt: true, updatedAt: true, profile: true,
        },
      });

      await logSensitiveAction(
        result.user.id,
        action === "ban" ? "USER_BANNED" : "USER_UNBANNED",
        targetUser.id,
        "USER",
        `${action === "ban" ? "封禁" : "解封"}用户 ${targetUser.email}${reason ? `，原因：${reason}` : ""}`
      );

      return NextResponse.json(updatedUser);
    }

    // 角色变更操作
    if (!role) {
      return NextResponse.json({ error: "缺少必要参数 role" }, { status: 400 });
    }

    const check = canChangeUserRole(
      result.user.role,
      targetUser.role as UserRole,
      role as UserRole,
      targetUser.email
    );

    if (!check.allowed) {
      if (targetUser.role === "SUPER_ADMIN" || targetUser.email === SUPER_ADMIN_EMAIL || role === "SUPER_ADMIN") {
        await logSensitiveAction(
          result.user.id,
          "ILLEGAL_ROLE_CHANGE_ATTEMPT",
          targetUser.id,
          "USER",
          `尝试将 ${targetUser.email} (${targetUser.role}) 修改为 ${role}。拒绝原因：${check.reason}`
        );
      }
      return NextResponse.json({ error: check.reason }, { status: 403 });
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { role: role as UserRole },
      select: {
        id: true, email: true, username: true, role: true,
        isBanned: true, createdAt: true, updatedAt: true, profile: true,
      },
    });

    await logSensitiveAction(
      result.user.id,
      "ROLE_CHANGED",
      targetUser.id,
      "USER",
      `将 ${targetUser.email} 的角色从 ${targetUser.role} 修改为 ${role}`
    );

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
