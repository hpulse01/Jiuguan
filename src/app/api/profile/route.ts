import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { profileSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        profile: true,
        _count: {
          select: {
            cases: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json({ error: "获取个人信息失败" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const result = profileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "数据验证失败", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { nickname, bio, avatar, location, website } = result.data;

    const profile = await db.profile.upsert({
      where: { userId: session.user.id },
      update: {
        nickname,
        bio,
        avatar: avatar || null,
        location,
        website: website || null,
      },
      create: {
        userId: session.user.id,
        nickname,
        bio,
        avatar: avatar || null,
        location,
        website: website || null,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json({ error: "更新个人信息失败" }, { status: 500 });
  }
}
