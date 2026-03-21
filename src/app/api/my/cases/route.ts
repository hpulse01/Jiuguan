import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "12", 10)));

    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      authorId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    const [cases, total] = await Promise.all([
      db.failureCase.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: pageSize,
        include: {
          category: true,
          tags: {
            include: { tag: true },
          },
          _count: {
            select: {
              usefulVotes: true,
              resonanceVotes: true,
              bookmarks: true,
              comments: true,
            },
          },
        },
      }),
      db.failureCase.count({ where }),
    ]);

    const formattedCases = cases.map((c) => ({
      ...c,
      tags: c.tags.map((t) => t.tag),
    }));

    return NextResponse.json({
      cases: formattedCases,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to fetch user cases:", error);
    return NextResponse.json({ error: "获取我的案例失败" }, { status: 500 });
  }
}
