import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { safeAuthorSelect } from "@/lib/query-helpers";

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
      userId: session.user.id,
    };

    const [bookmarks, total] = await Promise.all([
      db.bookmark.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          case: {
            include: {
              author: {
                select: safeAuthorSelect,
              },
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
          },
        },
      }),
      db.bookmark.count({ where }),
    ]);

    const formattedBookmarks = bookmarks.map((b) => ({
      ...b,
      case: {
        ...b.case,
        author: b.case.isAnonymous
          ? { id: b.case.author.id, username: "匿名用户", profile: { nickname: "匿名用户", avatar: null } }
          : b.case.author,
        tags: b.case.tags.map((t) => t.tag),
      },
    }));

    return NextResponse.json({
      bookmarks: formattedBookmarks,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to fetch bookmarks:", error);
    return NextResponse.json({ error: "获取收藏失败" }, { status: 500 });
  }
}
