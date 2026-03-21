import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { commentSchema } from "@/lib/validations";
import { createNotification } from "@/lib/notification";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const failureCase = await db.failureCase.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!failureCase) {
      return NextResponse.json({ error: "案例不存在" }, { status: 404 });
    }

    const comments = await db.comment.findMany({
      where: {
        caseId: failureCase.id,
        parentId: null,
      },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          include: { profile: true },
        },
        _count: {
          select: { likes: true },
        },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              include: { profile: true },
            },
            _count: {
              select: { likes: true },
            },
          },
        },
      },
    });

    const formattedComments = comments.map((c) => ({
      ...c,
      author: c.isAnonymous
        ? { id: c.author.id, username: "匿名用户", profile: { nickname: "匿名用户", avatar: null } }
        : c.author,
      replies: c.replies.map((r) => ({
        ...r,
        author: r.isAnonymous
          ? { id: r.author.id, username: "匿名用户", profile: { nickname: "匿名用户", avatar: null } }
          : r.author,
      })),
    }));

    return NextResponse.json(formattedComments);
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json({ error: "获取评论失败" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { slug } = await params;

    const failureCase = await db.failureCase.findUnique({
      where: { slug },
      select: { id: true, authorId: true, title: true },
    });

    if (!failureCase) {
      return NextResponse.json({ error: "案例不存在" }, { status: 404 });
    }

    const body = await request.json();
    const result = commentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "数据验证失败", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { content, commentType, isAnonymous, parentId } = result.data;

    // Verify parent comment exists if parentId is provided
    if (parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment || parentComment.caseId !== failureCase.id) {
        return NextResponse.json({ error: "父评论不存在" }, { status: 400 });
      }
    }

    const comment = await db.comment.create({
      data: {
        content,
        commentType,
        isAnonymous: isAnonymous || false,
        authorId: session.user.id,
        caseId: failureCase.id,
        parentId: parentId || null,
      },
      include: {
        author: {
          include: { profile: true },
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    // Create notification for case author (if commenter is not the author)
    if (failureCase.authorId !== session.user.id) {
      const notificationType = parentId ? "REPLY" : "COMMENT";
      await createNotification({
        type: notificationType,
        message: parentId
          ? `${session.user.nickname || session.user.username} 回复了你在「${failureCase.title}」的评论`
          : `${session.user.nickname || session.user.username} 评论了你的案例「${failureCase.title}」`,
        link: `/cases/${slug}`,
        userId: failureCase.authorId,
      });
    }

    // If it's a reply, also notify the parent comment author
    if (parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentId },
        select: { authorId: true },
      });
      if (parentComment && parentComment.authorId !== session.user.id && parentComment.authorId !== failureCase.authorId) {
        await createNotification({
          type: "REPLY",
          message: `${session.user.nickname || session.user.username} 回复了你在「${failureCase.title}」的评论`,
          link: `/cases/${slug}`,
          userId: parentComment.authorId,
        });
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json({ error: "创建评论失败" }, { status: 500 });
  }
}
