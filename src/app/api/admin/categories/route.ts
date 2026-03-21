import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    const categories = await db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { cases: true } },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "获取分类列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, icon, sortOrder } = body as {
      name: string;
      description?: string;
      icon?: string;
      sortOrder?: number;
    };

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "分类名称不能为空" },
        { status: 400 }
      );
    }

    const slug = generateSlug(name);

    const existing = await db.category.findFirst({
      where: { OR: [{ name }, { slug }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "分类名称或标识已存在" },
        { status: 409 }
      );
    }

    const category = await db.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description || null,
        icon: icon || null,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { error: "创建分类失败" },
      { status: 500 }
    );
  }
}
