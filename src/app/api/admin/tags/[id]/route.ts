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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name } = body as { name: string };

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "标签名称不能为空" },
        { status: 400 }
      );
    }

    const existing = await db.tag.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "标签不存在" }, { status: 404 });
    }

    const slug = generateSlug(name);

    const conflict = await db.tag.findFirst({
      where: {
        OR: [{ name: name.trim() }, { slug }],
        NOT: { id },
      },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "标签名称或标识已存在" },
        { status: 409 }
      );
    }

    const tag = await db.tag.update({
      where: { id },
      data: { name: name.trim(), slug },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Failed to update tag:", error);
    return NextResponse.json(
      { error: "更新标签失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await db.tag.findUnique({
      where: { id },
      include: { _count: { select: { cases: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "标签不存在" }, { status: 404 });
    }

    if (existing._count.cases > 0) {
      return NextResponse.json(
        { error: `该标签下还有 ${existing._count.cases} 个案例，无法删除` },
        { status: 400 }
      );
    }

    await db.tag.delete({ where: { id } });

    return NextResponse.json({ message: "标签已删除" });
  } catch (error) {
    console.error("Failed to delete tag:", error);
    return NextResponse.json(
      { error: "删除标签失败" },
      { status: 500 }
    );
  }
}
