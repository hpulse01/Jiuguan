import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    const user = await db.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        profile: true,
        _count: {
          select: {
            cases: {
              where: { status: "PUBLISHED" },
            },
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const cases = await db.failureCase.findMany({
      where: {
        authorId: user.id,
        status: "PUBLISHED",
      },
      orderBy: { publishedAt: "desc" },
      include: {
        category: true,
        tags: { include: { tag: true } },
        _count: {
          select: {
            usefulVotes: true,
            resonanceVotes: true,
            bookmarks: true,
            comments: true,
          },
        },
      },
    });

    const formattedCases = cases.map((c) => ({
      ...c,
      tags: c.tags.map((t) => t.tag),
    }));

    return NextResponse.json({
      user,
      cases: formattedCases,
    });
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return NextResponse.json({ error: "获取用户信息失败" }, { status: 500 });
  }
}
