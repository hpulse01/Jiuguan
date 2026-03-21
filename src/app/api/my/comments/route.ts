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
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const skip = (page - 1) * pageSize;

    const where = {
      authorId: session.user.id,
    };

    const [comments, total] = await Promise.all([
      db.comment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          case: {
            select: {
              id: true,
              slug: true,
              title: true,
              status: true,
            },
          },
          _count: {
            select: { likes: true },
          },
        },
      }),
      db.comment.count({ where }),
    ]);

    return NextResponse.json({
      comments,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to fetch user comments:", error);
    return NextResponse.json({ error: "获取我的评论失败" }, { status: 500 });
  }
}
