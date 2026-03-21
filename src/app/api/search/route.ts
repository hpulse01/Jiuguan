import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "12", 10)));

    if (!q.trim()) {
      return NextResponse.json({
        cases: [],
        pagination: { page, pageSize, total: 0, totalPages: 0 },
      });
    }

    const skip = (page - 1) * pageSize;

    const where = {
      status: "PUBLISHED" as const,
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { summary: { contains: q, mode: "insensitive" as const } },
        { background: { contains: q, mode: "insensitive" as const } },
        { rootCause: { contains: q, mode: "insensitive" as const } },
        { adviceToOthers: { contains: q, mode: "insensitive" as const } },
      ],
    };

    const [cases, total] = await Promise.all([
      db.failureCase.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
        include: {
          author: {
            include: { profile: true },
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
      }),
      db.failureCase.count({ where }),
    ]);

    const formattedCases = cases.map((c) => ({
      ...c,
      author: c.isAnonymous
        ? { id: c.author.id, username: "匿名用户", profile: { nickname: "匿名用户", avatar: null } }
        : c.author,
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
    console.error("Failed to search cases:", error);
    return NextResponse.json({ error: "搜索失败" }, { status: 500 });
  }
}
