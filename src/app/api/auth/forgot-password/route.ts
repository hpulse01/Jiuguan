import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sendPasswordResetEmail, isEmailConfigured } from "@/lib/email";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "邮件服务未配置，请联系管理员重置密码" },
        { status: 503 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const rl = rateLimit(`forgot-pwd:${ip}`, { limit: 3, windowSeconds: 300 });
    if (!rl.success) return rateLimitResponse(rl);

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "请提供邮箱地址" }, { status: 400 });
    }

    // 始终返回相同消息，防止邮箱枚举
    const successMessage = "如果该邮箱已注册，重置邮件已发送";

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: successMessage });
    }

    // 清除旧的未使用token
    await db.passwordResetToken.deleteMany({
      where: { email, used: false },
    });

    const token = nanoid(48);
    await db.passwordResetToken.create({
      data: {
        token,
        email,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1小时
      },
    });

    await sendPasswordResetEmail(email, token);

    return NextResponse.json({ message: successMessage });
  } catch (error) {
    console.error("Forgot password failed:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
