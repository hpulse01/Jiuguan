import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sendVerificationEmail, isEmailConfigured } from "@/lib/email";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const rl = rateLimit(`register:${ip}`, { limit: 5, windowSeconds: 300 });
    if (!rl.success) return rateLimitResponse(rl);

    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "数据验证失败", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, username, password } = result.data;

    const existingEmail = await db.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    const existingUsername = await db.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: "该用户名已被使用" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        email,
        username,
        passwordHash,
        emailVerified: !isEmailConfigured(), // 未配置邮件时自动验证
        profile: {
          create: {
            nickname: username,
          },
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        profile: true,
      },
    });

    // 发送验证邮件（如果SMTP已配置）
    if (isEmailConfigured()) {
      try {
        const token = nanoid(48);
        await db.verificationToken.create({
          data: {
            token,
            email,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时
          },
        });
        await sendVerificationEmail(email, token);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // 邮件发送失败不影响注册
      }
    }

    return NextResponse.json(
      {
        message: isEmailConfigured()
          ? "注册成功，请查收验证邮件"
          : "注册成功",
        user,
        requiresVerification: isEmailConfigured(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to register:", error);
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
