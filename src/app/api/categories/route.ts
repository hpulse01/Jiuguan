import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            cases: {
              where: { status: "PUBLISHED" },
            },
          },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ error: "获取分类失败" }, { status: 500 });
  }
}
