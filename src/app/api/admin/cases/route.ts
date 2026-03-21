import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireAdminAccess, isAuthError } from "@/lib/api-auth";
import { safeAuthorSelect } from "@/lib/query-helpers";

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

    const [cases, total] = await Promise.all([
      db.failureCase.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          author: {
            select: safeAuthorSelect,
          },
          category: true,
          _count: {
            select: { reports: true },
          },
        },
      }),
      db.failureCase.count({ where }),
    ]);

    return NextResponse.json({
      cases,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin cases:", error);
    return NextResponse.json({ error: "获取案例列表失败" }, { status: 500 });
  }
}
