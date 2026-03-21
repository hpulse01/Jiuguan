import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { username } = await params;

    const targetUser = await db.user.findUnique({
      where: { username },
      select: { id: true, username: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (targetUser.id === session.user.id) {
      return NextResponse.json({ error: "不能关注自己" }, { status: 400 });
    }

    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUser.id,
        },
      },
    });

    if (existingFollow) {
      await db.follow.delete({
        where: { id: existingFollow.id },
      });
      return NextResponse.json({ followed: false, message: "已取消关注" });
    }

    await db.follow.create({
      data: {
        followerId: session.user.id,
        followingId: targetUser.id,
      },
    });

    // Notify the target user
    await db.notification.create({
      data: {
        type: "FOLLOW",
        message: `${session.user.nickname || session.user.username} 关注了你`,
        link: `/users/${session.user.username}`,
        userId: targetUser.id,
      },
    });

    return NextResponse.json({ followed: true, message: "已关注" });
  } catch (error) {
    console.error("Failed to toggle follow:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
