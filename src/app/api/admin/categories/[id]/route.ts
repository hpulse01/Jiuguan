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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await apiRequireAdminAccess();
    if (isAuthError(result)) return result;

    const { id } = await params;
    const body = await request.json();
    const { name, description, icon, sortOrder } = body as {
      name?: string;
      description?: string;
      icon?: string;
      sortOrder?: number;
    };

    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "分类不存在" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) {
      data.name = name.trim();
      data.slug = generateSlug(name);

      const conflict = await db.category.findFirst({
        where: {
          OR: [{ name: data.name as string }, { slug: data.slug as string }],
          NOT: { id },
        },
      });
      if (conflict) {
        return NextResponse.json({ error: "分类名称或标识已存在" }, { status: 409 });
      }
    }
    if (description !== undefined) data.description = description;
    if (icon !== undefined) data.icon = icon;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    const category = await db.category.update({
      where: { id },
      data,
    });

    await logSensitiveAction(
      result.user.id,
      "CATEGORY_UPDATED",
      id,
      "CATEGORY",
      `更新分类「${category.name}」`
    );

    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json({ error: "更新分类失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await apiRequireAdminAccess();
    if (isAuthError(result)) return result;

    const { id } = await params;

    const existing = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { cases: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "分类不存在" }, { status: 404 });
    }

    if (existing._count.cases > 0) {
      return NextResponse.json(
        { error: `该分类下还有 ${existing._count.cases} 个案例，无法删除` },
        { status: 400 }
      );
    }

    await db.category.delete({ where: { id } });

    await logSensitiveAction(
      result.user.id,
      "CATEGORY_DELETED",
      id,
      "CATEGORY",
      `删除分类「${existing.name}」`
    );

    return NextResponse.json({ message: "分类已删除" });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json({ error: "删除分类失败" }, { status: 500 });
  }
}
