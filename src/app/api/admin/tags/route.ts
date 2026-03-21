import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireAdminAccess, isAuthError, logSensitiveAction } from "@/lib/api-auth";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const result = await apiRequireAdminAccess();
    if (isAuthError(result)) return result;

    const tags = await db.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { cases: true } },
      },
    });

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return NextResponse.json({ error: "获取标签列表失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await apiRequireAdminAccess();
    if (isAuthError(result)) return result;

    const body = await request.json();
    const { name } = body as { name: string };

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "标签名称不能为空" }, { status: 400 });
    }

    const slug = generateSlug(name);

    const existing = await db.tag.findFirst({
      where: { OR: [{ name }, { slug }] },
    });
    if (existing) {
      return NextResponse.json({ error: "标签名称或标识已存在" }, { status: 409 });
    }

    const tag = await db.tag.create({
      data: { name: name.trim(), slug },
    });

    await logSensitiveAction(
      result.user.id,
      "TAG_CREATED",
      tag.id,
      "TAG",
      `创建标签「${tag.name}」`
    );

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Failed to create tag:", error);
    return NextResponse.json({ error: "创建标签失败" }, { status: 500 });
  }
}
