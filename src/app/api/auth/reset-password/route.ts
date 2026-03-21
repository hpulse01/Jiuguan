import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const rl = rateLimit(`reset-pwd:${ip}`, { limit: 5, windowSeconds: 300 });
    if (!rl.success) return rateLimitResponse(rl);

    const { token, password } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "无效的重置链接" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "密码至少6个字符" }, { status: 400 });
    }

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.used) {
      return NextResponse.json({ error: "重置链接无效或已使用" }, { status: 400 });
    }

    if (resetToken.expiresAt < new Date()) {
      await db.passwordResetToken.delete({ where: { id: resetToken.id } });
      return NextResponse.json({ error: "重置链接已过期" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // 更新密码 + 标记token已使用
    await Promise.all([
      db.user.updateMany({
        where: { email: resetToken.email },
        data: { passwordHash },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({ message: "密码重置成功！" });
  } catch (error) {
    console.error("Reset password failed:", error);
    return NextResponse.json({ error: "重置失败" }, { status: 500 });
  }
}
