import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { failureCaseSchema, draftCaseSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const failureCase = await db.failureCase.findUnique({
      where: { slug },
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
    });

    if (!failureCase) {
      return NextResponse.json({ error: "案例不存在" }, { status: 404 });
    }

    // Only published cases are publicly visible, unless the viewer is the author
    const session = await auth();
    if (
      failureCase.status !== "PUBLISHED" &&
      failureCase.authorId !== session?.user?.id &&
      session?.user?.role !== "ADMIN" &&
      session?.user?.role !== "MODERATOR"
    ) {
      return NextResponse.json({ error: "案例不存在" }, { status: 404 });
    }

    // Increment view count
    await db.failureCase.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });

    // Check if current user has voted/bookmarked
    let userInteraction = null;
    if (session?.user?.id) {
      const [usefulVote, resonanceVote, bookmark] = await Promise.all([
        db.caseUsefulVote.findUnique({
          where: { userId_caseId: { userId: session.user.id, caseId: failureCase.id } },
        }),
        db.caseResonanceVote.findUnique({
          where: { userId_caseId: { userId: session.user.id, caseId: failureCase.id } },
        }),
        db.bookmark.findUnique({
          where: { userId_caseId: { userId: session.user.id, caseId: failureCase.id } },
        }),
      ]);
      userInteraction = {
        hasVotedUseful: !!usefulVote,
        hasVotedResonance: !!resonanceVote,
        hasBookmarked: !!bookmark,
      };
    }

    const formattedCase = {
      ...failureCase,
      viewCount: failureCase.viewCount + 1,
      author: failureCase.isAnonymous && failureCase.authorId !== session?.user?.id
        ? { id: failureCase.author.id, username: "匿名用户", profile: { nickname: "匿名用户", avatar: null } }
        : failureCase.author,
      tags: failureCase.tags.map((t) => t.tag),
      userInteraction,
    };

    return NextResponse.json(formattedCase);
  } catch (error) {
    console.error("Failed to fetch case:", error);
    return NextResponse.json({ error: "获取案例详情失败" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { slug } = await params;

    const existingCase = await db.failureCase.findUnique({
      where: { slug },
    });

    if (!existingCase) {
      return NextResponse.json({ error: "案例不存在" }, { status: 404 });
    }

    if (existingCase.authorId !== session.user.id) {
      return NextResponse.json({ error: "无权修改此案例" }, { status: 403 });
    }

    const body = await request.json();
    const status = body.status || existingCase.status;
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

    // Delete existing tags and recreate
    if (tagIds) {
      await db.failureCaseTag.deleteMany({
        where: { caseId: existingCase.id },
      });
    }

    const updatedCase = await db.failureCase.update({
      where: { slug },
      data: {
        ...caseData,
        categoryId: caseData.categoryId || existingCase.categoryId,
        tags: tagIds && tagIds.length > 0
          ? {
              create: tagIds.map((tagId: string) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        author: { include: { profile: true } },
        category: true,
        tags: { include: { tag: true } },
      },
    });

    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error("Failed to update case:", error);
    return NextResponse.json({ error: "更新案例失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { slug } = await params;

    const existingCase = await db.failureCase.findUnique({
      where: { slug },
    });

    if (!existingCase) {
      return NextResponse.json({ error: "案例不存在" }, { status: 404 });
    }

    const isAuthor = existingCase.authorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: "无权删除此案例" }, { status: 403 });
    }

    await db.failureCase.delete({
      where: { slug },
    });

    return NextResponse.json({ message: "案例已删除" });
  } catch (error) {
    console.error("Failed to delete case:", error);
    return NextResponse.json({ error: "删除案例失败" }, { status: 500 });
  }
}
