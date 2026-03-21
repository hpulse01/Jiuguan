import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireAdmin, isAuthError, logSensitiveAction } from "@/lib/api-auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await apiRequireAdmin();
    if (isAuthError(result)) return result;

    const { id } = await params;

    const existingCase = await db.failureCase.findUnique({ where: { id } });
    if (!existingCase) {
      return NextResponse.json({ error: "案例不存在" }, { status: 404 });
    }

    if (existingCase.status !== "ARCHIVED" && existingCase.status !== "REJECTED") {
      return NextResponse.json(
        { error: "只能恢复已归档或已驳回的案例" },
        { status: 400 }
      );
    }

    const updatedCase = await db.failureCase.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    await logSensitiveAction(
      result.user.id,
      "CONTENT_RESTORED",
      id,
      "CASE",
      `恢复案例「${existingCase.title}」为已发布状态`
    );

    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error("Failed to restore case:", error);
    return NextResponse.json({ error: "恢复案例失败" }, { status: 500 });
  }
}
