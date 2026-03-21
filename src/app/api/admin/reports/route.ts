import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireAdminAccess, isAuthError } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const result = await apiRequireAdminAccess();
    if (isAuthError(result)) return result;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      db.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              email: true,
              profile: { select: { nickname: true, avatar: true } },
            },
          },
          case: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              authorId: true,
            },
          },
        },
      }),
      db.report.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json({ error: "获取举报列表失败" }, { status: 500 });
  }
}
