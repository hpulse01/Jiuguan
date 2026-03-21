import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "无效的验证链接" }, { status: 400 });
    }

    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: "验证链接无效或已过期" }, { status: 400 });
    }

    if (verificationToken.expiresAt < new Date()) {
      await db.verificationToken.delete({ where: { id: verificationToken.id } });
      return NextResponse.json({ error: "验证链接已过期，请重新发送" }, { status: 400 });
    }

    // 标记用户邮箱已验证
    await db.user.updateMany({
      where: { email: verificationToken.email },
      data: { emailVerified: true },
    });

    // 删除已使用的token
    await db.verificationToken.deleteMany({
      where: { email: verificationToken.email },
    });

    return NextResponse.json({ message: "邮箱验证成功！" });
  } catch (error) {
    console.error("Email verification failed:", error);
    return NextResponse.json({ error: "验证失败" }, { status: 500 });
  }
}
