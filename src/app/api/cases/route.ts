import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { failureCaseSchema, draftCaseSchema } from "@/lib/validations";
import { nanoid } from "nanoid";
import slugify from "slugify";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const categoryId = searchParams.get("categoryId") || undefined;
    const tagIdsParam = searchParams.get("tagIds");
    const tagIds = tagIdsParam ? tagIdsParam.split(",").filter(Boolean) : undefined;
    const sort = searchParams.get("sort") || "latest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "12", 10)));

    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      status: "PUBLISHED",
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (tagIds && tagIds.length > 0) {
      where.tags = {
        some: {
          tagId: { in: tagIds },
        },
      };
    }

    let orderBy: Record<string, string>[] = [];
    switch (sort) {
      case "hot":
        orderBy = [{ viewCount: "desc" }, { createdAt: "desc" }];
        break;
      case "useful":
        orderBy = [{ usefulVotes: { _count: "desc" } } as unknown as Record<string, string>, { createdAt: "desc" }];
        break;
      case "resonance":
        orderBy = [{ resonanceVotes: { _count: "desc" } } as unknown as Record<string, string>, { createdAt: "desc" }];
        break;
      case "latest":
      default:
        orderBy = [{ publishedAt: "desc" }, { createdAt: "desc" }];
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
            include: {
              profile: true,
            },
          },
          category: true,
          tags: {
            include: {
              tag: true,
            },
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
    console.error("Failed to fetch cases:", error);
    return NextResponse.json(
      { error: "获取案例列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const status = body.status || "DRAFT";

    const schema = status === "DRAFT" ? draftCaseSchema : failureCaseSchema;
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "数据验证失败", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;
    const { tagIds, ...caseData } = data;

    const baseSlug = slugify(caseData.title, { lower: true, strict: true }) || "case";
    const slug = `${baseSlug}-${nanoid(8)}`;

    const newCase = await db.failureCase.create({
      data: {
        ...caseData,
        slug,
        status: status === "PUBLISHED" ? "PENDING" : status,
        authorId: session.user.id,
        categoryId: caseData.categoryId || "",
        summary: caseData.summary || "",
        background: caseData.background || "",
        originalGoal: caseData.originalGoal || "",
        decisionPoint: caseData.decisionPoint || "",
        actionsTaken: caseData.actionsTaken || "",
        ignoredSignals: caseData.ignoredSignals || "",
        earliestWarning: caseData.earliestWarning || "",
        outcome: caseData.outcome || "",
        rootCause: caseData.rootCause || "",
        whatWouldDoDifferently: caseData.whatWouldDoDifferently || "",
        adviceToOthers: caseData.adviceToOthers || "",
        tags: tagIds && tagIds.length > 0
          ? {
              create: tagIds.map((tagId: string) => ({
                tagId,
              })),
            }
          : undefined,
      },
      include: {
        author: { include: { profile: true } },
        category: true,
        tags: { include: { tag: true } },
      },
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    console.error("Failed to create case:", error);
    return NextResponse.json(
      { error: "创建案例失败" },
      { status: 500 }
    );
  }
}
