import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

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
    });

    if (!failureCase) {
      return NextResponse.json({ error: "案例不存在" }, { status: 404 });
    }

    if (failureCase.authorId !== session.user.id) {
      return NextResponse.json({ error: "无权提交此案例" }, { status: 403 });
    }

    if (failureCase.status !== "DRAFT" && failureCase.status !== "REJECTED") {
      return NextResponse.json(
        { error: "只有草稿或被驳回的案例可以提交审核" },
        { status: 400 }
      );
    }

    const updatedCase = await db.failureCase.update({
      where: { slug },
      data: { status: "PENDING" },
    });

    return NextResponse.json({
      message: "案例已提交审核",
      case: updatedCase,
    });
  } catch (error) {
    console.error("Failed to submit case:", error);
    return NextResponse.json({ error: "提交审核失败" }, { status: 500 });
  }
}
