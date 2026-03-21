import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireAdminAccess, isAuthError } from "@/lib/api-auth";
import { isSuperAdmin } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const result = await apiRequireAdminAccess();
    if (isAuthError(result)) return result;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
    const skip = (page - 1) * pageSize;
    const actionFilter = searchParams.get("action") || undefined;

    const where: Record<string, unknown> = {};

    // 非超级管理员不能看到敏感操作日志
    if (!isSuperAdmin(result.user.role)) {
      where.action = {
        notIn: [
          "ILLEGAL_ROLE_CHANGE_ATTEMPT",
          "ILLEGAL_BAN_ATTEMPT",
          "ILLEGAL_DELETE_ATTEMPT",
          "ILLEGAL_EMAIL_CHANGE_ATTEMPT",
        ],
      };
    }

    if (actionFilter) {
      where.action = actionFilter;
    }

    const [logs, total] = await Promise.all([
      db.moderationLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          moderator: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
              profile: { select: { nickname: true, avatar: true } },
            },
          },
        },
      }),
      db.moderationLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to fetch moderation logs:", error);
    return NextResponse.json({ error: "获取审核日志失败" }, { status: 500 });
  }
}
