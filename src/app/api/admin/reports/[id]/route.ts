import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireAdminAccess, isAuthError, logSensitiveAction } from "@/lib/api-auth";
import { createNotification } from "@/lib/notification";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await apiRequireAdminAccess();
    if (isAuthError(result)) return result;

    const { id } = await params;
    const body = await request.json();
    const { action, hideContent } = body as { action: string; hideContent?: boolean };

    if (action !== "resolve" && action !== "dismiss") {
      return NextResponse.json(
        { error: "无效的操作，必须是 resolve 或 dismiss" },
        { status: 400 }
      );
    }

    const report = await db.report.findUnique({
      where: { id },
      include: { case: true },
    });

    if (!report) {
      return NextResponse.json({ error: "举报不存在" }, { status: 404 });
    }

    if (report.status !== "PENDING") {
      return NextResponse.json({ error: "该举报已被处理" }, { status: 400 });
    }

    const newStatus = action === "resolve" ? "RESOLVED" : "DISMISSED";

    const updates: Promise<unknown>[] = [
      db.report.update({
        where: { id },
        data: { status: newStatus },
      }),
      logSensitiveAction(
        result.user.id,
        action === "resolve" ? "REPORT_RESOLVED" : "REPORT_DISMISSED",
        id,
        "REPORT",
        `举报「${report.reason}」已${action === "resolve" ? "处理" : "驳回"}`
      ),
      // 通知举报者处理结果
      createNotification({
        type: "REPORT_HANDLED",
        message: `您对案例「${report.case.title}」的举报已${action === "resolve" ? "处理" : "驳回"}`,
        userId: report.reporterId,
        link: `/cases/${report.case.slug}`,
      }),
    ];

    // 根据操作结果处理内容
    if (action === "resolve" && hideContent !== false) {
      updates.push(
        db.failureCase.update({
          where: { id: report.caseId },
          data: { status: "ARCHIVED" },
        })
      );
      updates.push(
        logSensitiveAction(
          result.user.id,
          "CONTENT_HIDDEN",
          report.caseId,
          "CASE",
          `因举报处理，案例「${report.case.title}」已被隐藏`
        )
      );
    }

    await Promise.all(updates);

    const updatedReport = await db.report.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: { select: { nickname: true, avatar: true } },
          },
        },
        case: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error("Failed to handle report:", error);
    return NextResponse.json({ error: "处理举报失败" }, { status: 500 });
  }
}
