import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

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

    const existingBookmark = await db.bookmark.findUnique({
      where: {
        userId_caseId: {
          userId: session.user.id,
          caseId: failureCase.id,
        },
      },
    });

    if (existingBookmark) {
      await db.bookmark.delete({
        where: { id: existingBookmark.id },
      });
      return NextResponse.json({ bookmarked: false, message: "已取消收藏" });
    }

    await db.bookmark.create({
      data: {
        userId: session.user.id,
        caseId: failureCase.id,
      },
    });

    // Notify case author
    if (failureCase.authorId !== session.user.id) {
      await db.notification.create({
        data: {
          type: "BOOKMARK",
          message: `${session.user.nickname || session.user.username} 收藏了你的案例「${failureCase.title}」`,
          link: `/cases/${slug}`,
          userId: failureCase.authorId,
        },
      });
    }

    return NextResponse.json({ bookmarked: true, message: "已收藏" });
  } catch (error) {
    console.error("Failed to toggle bookmark:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
