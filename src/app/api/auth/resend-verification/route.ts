import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sendVerificationEmail, isEmailConfigured } from "@/lib/email";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    if (!isEmailConfigured()) {
      return NextResponse.json({ error: "邮件服务未配置" }, { status: 503 });
    }

    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const rl = rateLimit(`resend-verify:${ip}`, { limit: 3, windowSeconds: 300 });
    if (!rl.success) return rateLimitResponse(rl);

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "请提供邮箱地址" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { emailVerified: true },
    });

    if (!user) {
      // 为防止邮箱枚举攻击，始终返回成功
      return NextResponse.json({ message: "如果该邮箱已注册，验证邮件已发送" });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "该邮箱已验证" });
    }

    // 清除旧token
    await db.verificationToken.deleteMany({ where: { email } });

    const token = nanoid(48);
    await db.verificationToken.create({
      data: {
        token,
        email,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail(email, token);

    return NextResponse.json({ message: "验证邮件已发送，请查收" });
  } catch (error) {
    console.error("Resend verification failed:", error);
    return NextResponse.json({ error: "发送失败" }, { status: 500 });
  }
}
