import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const sort = searchParams.get("sort") || "latest";
    const categoryId = searchParams.get("categoryId") || "";
    const tagIds = searchParams.get("tagIds") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "12", 10)));
    const skip = (page - 1) * pageSize;

    const where: Prisma.FailureCaseWhereInput = {
      status: "PUBLISHED",
    };

    // 文本搜索
    if (q.trim()) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
        { background: { contains: q, mode: "insensitive" } },
        { rootCause: { contains: q, mode: "insensitive" } },
        { adviceToOthers: { contains: q, mode: "insensitive" } },
        { earliestWarning: { contains: q, mode: "insensitive" } },
        { outcome: { contains: q, mode: "insensitive" } },
        // 标签名搜索
        { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
      ];
    }

    // 分类筛选
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // 多标签组合筛选
    if (tagIds) {
      const tagIdArray = tagIds.split(",").filter(Boolean);
      if (tagIdArray.length > 0) {
        where.AND = tagIdArray.map((tagId) => ({
          tags: { some: { tagId } },
        }));
      }
    }

    // 排序
    let orderBy: Prisma.FailureCaseOrderByWithRelationInput[];
    switch (sort) {
      case "hot":
        orderBy = [
          { viewCount: "desc" },
          { publishedAt: "desc" },
        ];
        break;
      case "useful":
        orderBy = [
          { usefulVotes: { _count: "desc" } },
          { publishedAt: "desc" },
        ];
        break;
      case "resonance":
        orderBy = [
          { resonanceVotes: { _count: "desc" } },
          { publishedAt: "desc" },
        ];
        break;
      case "latest":
      default:
        orderBy = [
          { publishedAt: "desc" },
          { createdAt: "desc" },
        ];
        break;
    }

    const [cases, total] = await Promise.all([
      db.failureCase.findMany({
        where,
        orderBy,
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
      costSummary: [
        c.costTime && "时间",
        c.costMoney && "金钱",
        c.costRelationship && "关系",
        c.costOpportunity && "机会",
      ].filter(Boolean),
      earliestWarningPreview: c.earliestWarning
        ? c.earliestWarning.length > 60
          ? c.earliestWarning.slice(0, 60) + "..."
          : c.earliestWarning
        : null,
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
