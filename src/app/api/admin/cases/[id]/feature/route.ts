import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireAdminAccess, isAuthError, logSensitiveAction } from "@/lib/api-auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await apiRequireAdminAccess();
    if (isAuthError(result)) return result;

    const { id } = await params;

    const existingCase = await db.failureCase.findUnique({ where: { id } });
    if (!existingCase) {
      return NextResponse.json({ error: "案例不存在" }, { status: 404 });
    }

    const newFeatured = !existingCase.isFeatured;

    const [updatedCase] = await Promise.all([
      db.failureCase.update({
        where: { id },
        data: { isFeatured: newFeatured },
      }),
      logSensitiveAction(
        result.user.id,
        newFeatured ? "CASE_FEATURED" : "CASE_UNFEATURED",
        id,
        "CASE",
        `案例「${existingCase.title}」${newFeatured ? "设为精选" : "取消精选"}`
      ),
    ]);

    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error("Failed to toggle featured:", error);
    return NextResponse.json({ error: "切换精选状态失败" }, { status: 500 });
  }
}
