import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;

    const comment = await db.comment.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "评论不存在" }, { status: 404 });
    }

    const existingLike = await db.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId: id,
        },
      },
    });

    if (existingLike) {
      await db.commentLike.delete({
        where: { id: existingLike.id },
      });
      return NextResponse.json({ liked: false, message: "已取消点赞" });
    }

    await db.commentLike.create({
      data: {
        userId: session.user.id,
        commentId: id,
      },
    });

    return NextResponse.json({ liked: true, message: "已点赞" });
  } catch (error) {
    console.error("Failed to toggle comment like:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
