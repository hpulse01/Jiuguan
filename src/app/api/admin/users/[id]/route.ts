import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "只有管理员可以修改用户角色" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { role } = body as { role: string };

    if (!role) {
      return NextResponse.json(
        { error: "缺少必要参数 role" },
        { status: 400 }
      );
    }

    const validRoles = ["GUEST", "USER", "MODERATOR", "ADMIN"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "无效的角色" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (id === session.user.id) {
      return NextResponse.json(
        { error: "不能修改自己的角色" },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: { role: role as "GUEST" | "USER" | "MODERATOR" | "ADMIN" },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update user role:", error);
    return NextResponse.json(
      { error: "更新用户角色失败" },
      { status: 500 }
    );
  }
}
