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

    const existingVote = await db.caseUsefulVote.findUnique({
      where: {
        userId_caseId: {
          userId: session.user.id,
          caseId: failureCase.id,
        },
      },
    });

    if (existingVote) {
      await db.caseUsefulVote.delete({
        where: { id: existingVote.id },
      });
      return NextResponse.json({ voted: false, message: "已取消有用投票" });
    }

    await db.caseUsefulVote.create({
      data: {
        userId: session.user.id,
        caseId: failureCase.id,
      },
    });

    // Notify case author
    if (failureCase.authorId !== session.user.id) {
      await db.notification.create({
        data: {
          type: "USEFUL_VOTE",
          message: `${session.user.nickname || session.user.username} 觉得你的案例「${failureCase.title}」有用`,
          link: `/cases/${slug}`,
          userId: failureCase.authorId,
        },
      });
    }

    return NextResponse.json({ voted: true, message: "已标记有用" });
  } catch (error) {
    console.error("Failed to toggle useful vote:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
