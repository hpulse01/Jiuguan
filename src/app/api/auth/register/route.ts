import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

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

    // Check if email already exists
    const existingEmail = await db.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    // Check if username already exists
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
        createdAt: true,
        profile: true,
      },
    });

    return NextResponse.json(
      { message: "注册成功", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to register:", error);
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
