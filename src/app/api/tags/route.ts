import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    const where: Record<string, unknown> = {};

    if (q) {
      where.name = { contains: q, mode: "insensitive" };
    }

    const tags = await db.tag.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            cases: {
              where: {
                case: { status: "PUBLISHED" },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return NextResponse.json({ error: "获取标签失败" }, { status: 500 });
  }
}
