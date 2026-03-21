import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalCases,
      draftCases,
      pendingCases,
      publishedCases,
      totalComments,
      totalBookmarks,
      pendingReports,
      topCategories,
      topTags,
      recentCases,
    ] = await Promise.all([
      db.user.count(),
      db.failureCase.count(),
      db.failureCase.count({ where: { status: "DRAFT" } }),
      db.failureCase.count({ where: { status: "PENDING" } }),
      db.failureCase.count({ where: { status: "PUBLISHED" } }),
      db.comment.count(),
      db.bookmark.count(),
      db.report.count({ where: { status: "PENDING" } }),
      db.category.findMany({
        take: 5,
        orderBy: { cases: { _count: "desc" } },
        include: { _count: { select: { cases: true } } },
      }),
      db.failureCaseTag.groupBy({
        by: ["tagId"],
        _count: { tagId: true },
        orderBy: { _count: { tagId: "desc" } },
        take: 5,
      }),
      db.failureCase.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

    // Fetch tag details for topTags
    const tagIds = topTags.map((t) => t.tagId);
    const tags = await db.tag.findMany({
      where: { id: { in: tagIds } },
    });
    const tagMap = new Map(tags.map((t) => [t.id, t]));

    const topTagsFormatted = topTags.map((t) => ({
      tag: tagMap.get(t.tagId),
      caseCount: t._count.tagId,
    }));

    // Build 7-day trend
    const trend: { date: string; count: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const count = recentCases.filter((c) => {
        const cDate = new Date(c.createdAt).toISOString().split("T")[0];
        return cDate === dateStr;
      }).length;
      trend.push({ date: dateStr, count });
    }

    return NextResponse.json({
      stats: {
        totalUsers,
        totalCases,
        draftCases,
        pendingCases,
        publishedCases,
        totalComments,
        totalBookmarks,
        pendingReports,
      },
      topCategories: topCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        caseCount: c._count.cases,
      })),
      topTags: topTagsFormatted,
      caseTrend: trend,
    });
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    return NextResponse.json(
      { error: "获取统计数据失败" },
      { status: 500 }
    );
  }
}
