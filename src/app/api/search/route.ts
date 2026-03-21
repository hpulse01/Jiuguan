import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeAuthorSelect } from "@/lib/query-helpers";
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

    if (q.trim()) {
      // 双重搜索策略：全文索引（精确排序）+ LIKE（中文模糊兜底）
      let fullTextIds: string[] = [];
      try {
        const searchTerms = q.trim().split(/\s+/).map(t => t.replace(/[&|!():*]/g, '')).filter(Boolean);
        if (searchTerms.length > 0) {
          const tsQuery = searchTerms.join(" & ");
          const results = await db.$queryRawUnsafe<{ id: string }[]>(
            `SELECT id FROM "FailureCase"
             WHERE "searchVector" @@ to_tsquery('simple', $1) AND status = 'PUBLISHED'
             ORDER BY ts_rank("searchVector", to_tsquery('simple', $1)) DESC
             LIMIT 200`,
            tsQuery
          );
          fullTextIds = results.map(r => r.id);
        }
      } catch {
        // searchVector 列不可用，仅使用 LIKE
      }

      // 同时使用 LIKE 搜索覆盖中文部分匹配（全文索引对中文分词有限）
      const likeConditions: Prisma.FailureCaseWhereInput[] = [
        { title: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
        { background: { contains: q, mode: "insensitive" } },
        { rootCause: { contains: q, mode: "insensitive" } },
        { adviceToOthers: { contains: q, mode: "insensitive" } },
        { earliestWarning: { contains: q, mode: "insensitive" } },
        { outcome: { contains: q, mode: "insensitive" } },
        { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
      ];

      if (fullTextIds.length > 0) {
        // 合并：全文索引命中 OR LIKE 命中
        where.OR = [
          { id: { in: fullTextIds } },
          ...likeConditions,
        ];
      } else {
        where.OR = likeConditions;
      }
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
