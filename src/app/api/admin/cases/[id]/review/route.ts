import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireAdminAccess, isAuthError, logSensitiveAction } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await apiRequireAdminAccess();
    if (isAuthError(result)) return result;

    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body as { action: string; reason?: string };

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "无效的操作，必须是 approve 或 reject" },
        { status: 400 }
      );
    }

    const existingCase = await db.failureCase.findUnique({ where: { id } });
    if (!existingCase) {
      return NextResponse.json({ error: "案例不存在" }, { status: 404 });
    }

    if (existingCase.status !== "PENDING") {
      return NextResponse.json(
        { error: "只能审核待审核状态的案例" },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "PUBLISHED" : "REJECTED";
    const notificationType = action === "approve" ? "REVIEW_APPROVED" : "REVIEW_REJECTED";
    const notificationMessage =
      action === "approve"
        ? `您的案例「${existingCase.title}」已通过审核并发布`
        : `您的案例「${existingCase.title}」未通过审核${reason ? `，原因：${reason}` : ""}`;

    const [updatedCase] = await Promise.all([
      db.failureCase.update({
        where: { id },
        data: {
          status: newStatus,
          publishedAt: action === "approve" ? new Date() : undefined,
        },
      }),
      db.notification.create({
        data: {
          type: notificationType,
          message: notificationMessage,
          userId: existingCase.authorId,
          link: `/cases/${existingCase.slug}`,
        },
      }),
      logSensitiveAction(
        result.user.id,
        action === "approve" ? "CASE_APPROVED" : "CASE_REJECTED",
        id,
        "CASE",
        reason || undefined
      ),
    ]);

    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error("Failed to review case:", error);
    return NextResponse.json({ error: "审核案例失败" }, { status: 500 });
  }
}
