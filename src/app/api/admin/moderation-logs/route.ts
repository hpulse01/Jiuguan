import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      db.moderationLog.findMany({
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
      db.moderationLog.count(),
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
    return NextResponse.json(
      { error: "获取审核日志失败" },
      { status: 500 }
    );
  }
}
