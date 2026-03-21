import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

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
    const { action } = body as { action: string };

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
      return NextResponse.json(
        { error: "该举报已被处理" },
        { status: 400 }
      );
    }

    const newStatus = action === "resolve" ? "RESOLVED" : "DISMISSED";

    const updates: Promise<unknown>[] = [
      db.report.update({
        where: { id },
        data: { status: newStatus },
      }),
      db.moderationLog.create({
        data: {
          action: action === "resolve" ? "REPORT_RESOLVED" : "REPORT_DISMISSED",
          detail: `举报「${report.reason}」已${action === "resolve" ? "处理" : "驳回"}`,
          targetId: id,
          targetType: "REPORT",
          moderatorId: session.user.id,
        },
      }),
    ];

    // Archive the case if the report is resolved
    if (action === "resolve") {
      updates.push(
        db.failureCase.update({
          where: { id: report.caseId },
          data: { status: "ARCHIVED" },
        })
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
    return NextResponse.json(
      { error: "处理举报失败" },
      { status: 500 }
    );
  }
}
