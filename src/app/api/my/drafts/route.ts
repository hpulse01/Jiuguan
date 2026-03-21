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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "12", 10)));

    const skip = (page - 1) * pageSize;

    const where = {
      authorId: session.user.id,
      status: "DRAFT" as const,
    };

    const [drafts, total] = await Promise.all([
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
        },
      }),
      db.failureCase.count({ where }),
    ]);

    const formattedDrafts = drafts.map((d) => ({
      ...d,
      tags: d.tags.map((t) => t.tag),
    }));

    return NextResponse.json({
      drafts: formattedDrafts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to fetch drafts:", error);
    return NextResponse.json({ error: "获取草稿失败" }, { status: 500 });
  }
}
