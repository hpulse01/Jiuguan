import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { reportSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { slug } = await params;

    const failureCase = await db.failureCase.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!failureCase) {
      return NextResponse.json({ error: "案例不存在" }, { status: 404 });
    }

    const body = await request.json();
    const result = reportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "数据验证失败", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { reason, detail } = result.data;

    // Check if user already reported this case
    const existingReport = await db.report.findFirst({
      where: {
        reporterId: session.user.id,
        caseId: failureCase.id,
        status: "PENDING",
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "你已经举报过此案例，请等待处理" },
        { status: 400 }
      );
    }

    const report = await db.report.create({
      data: {
        reason,
        detail: detail || null,
        reporterId: session.user.id,
        caseId: failureCase.id,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Failed to create report:", error);
    return NextResponse.json({ error: "举报失败" }, { status: 500 });
  }
}
