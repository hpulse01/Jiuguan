import { db } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";
import { Tag, Hash } from "lucide-react";

export const metadata: Metadata = {
  title: "标签浏览 - 酒馆",
  description: "按标签浏览失败案例，快速找到感兴趣的话题",
};

export default async function TagsPage() {
  const tags = await db.tag.findMany({
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

  // Find max count for relative sizing
  const maxCount = Math.max(...tags.map((t) => t._count.cases), 1);

  function getTagSize(count: number): string {
    const ratio = count / maxCount;
    if (ratio > 0.75) return "text-xl font-semibold px-5 py-2.5";
    if (ratio > 0.5) return "text-lg font-medium px-4 py-2";
    if (ratio > 0.25) return "text-base px-3.5 py-1.5";
    return "text-sm px-3 py-1.5";
  }

  return (
    <div className="min-h-screen bg-stone-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-stone-100 mb-2">
            标签浏览
          </h1>
          <p className="text-stone-400">
            通过标签快速找到你感兴趣的失败案例
          </p>
        </div>

        {/* Tag cloud */}
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-3 items-center">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className={`group inline-flex items-center gap-1.5 rounded-full border border-stone-800/60 bg-stone-900/50 text-stone-300 transition-all duration-200 hover:bg-stone-900/80 hover:border-amber-900/40 hover:text-amber-400 hover:shadow-lg hover:shadow-amber-950/20 ${getTagSize(tag._count.cases)}`}
              >
                <Hash className="h-3.5 w-3.5 text-stone-500 group-hover:text-amber-500 transition-colors" />
                <span>{tag.name}</span>
                <span className="text-xs text-stone-500 group-hover:text-amber-500/70 ml-0.5">
                  {tag._count.cases}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Tag className="h-12 w-12 text-stone-600 mx-auto mb-4" />
            <p className="text-lg text-stone-300 mb-1">暂无标签</p>
            <p className="text-sm text-stone-500">
              还没有任何标签被创建
            </p>
          </div>
        )}

        {/* Tag grid (alternative structured view) */}
        {tags.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-semibold text-stone-100 mb-6">
              全部标签
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tags/${tag.slug}`}
                  className="group flex items-center justify-between rounded-lg border border-stone-800/60 bg-stone-900/50 px-4 py-3 transition-all duration-200 hover:bg-stone-900/80 hover:border-amber-900/40 hover:shadow-lg hover:shadow-amber-950/20"
                >
                  <span className="text-sm text-stone-200 group-hover:text-amber-400 transition-colors truncate">
                    {tag.name}
                  </span>
                  <span className="text-xs text-stone-500 ml-2 flex-shrink-0">
                    {tag._count.cases}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
