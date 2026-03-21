import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(
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

    const existingCase = await db.failureCase.findUnique({
      where: { id },
    });

    if (!existingCase) {
      return NextResponse.json({ error: "案例不存在" }, { status: 404 });
    }

    const newFeatured = !existingCase.isFeatured;

    const [updatedCase] = await Promise.all([
      db.failureCase.update({
        where: { id },
        data: { isFeatured: newFeatured },
      }),
      db.moderationLog.create({
        data: {
          action: newFeatured ? "CASE_FEATURED" : "CASE_UNFEATURED",
          detail: `案例「${existingCase.title}」${newFeatured ? "设为精选" : "取消精选"}`,
          targetId: id,
          targetType: "CASE",
          moderatorId: session.user.id,
        },
      }),
    ]);

    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error("Failed to toggle featured:", error);
    return NextResponse.json(
      { error: "切换精选状态失败" },
      { status: 500 }
    );
  }
}
