import { db } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Briefcase,
  Heart,
  GraduationCap,
  TrendingUp,
  Home,
  Users,
  Code,
  Palette,
  Utensils,
  Stethoscope,
  Scale,
  Plane,
  FolderOpen,
} from "lucide-react";

export const metadata: Metadata = {
  title: "分类浏览 - 酒馆",
  description: "按分类浏览失败案例，找到与你相关的领域",
};

// Map category icon strings to Lucide components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  briefcase: Briefcase,
  heart: Heart,
  "graduation-cap": GraduationCap,
  "trending-up": TrendingUp,
  home: Home,
  users: Users,
  code: Code,
  palette: Palette,
  utensils: Utensils,
  stethoscope: Stethoscope,
  scale: Scale,
  plane: Plane,
};

function getCategoryIcon(iconName: string | null) {
  if (!iconName) return FolderOpen;
  return iconMap[iconName] || FolderOpen;
}

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { cases: { where: { status: "PUBLISHED" } } },
      },
    },
  });

  return (
    <div className="min-h-screen bg-stone-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-stone-100 mb-2">
            分类浏览
          </h1>
          <p className="text-stone-400">
            选择一个领域，看看别人踩过哪些坑
          </p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.icon);
            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group block"
              >
                <div className="h-full rounded-xl border border-stone-800/60 bg-stone-900/50 p-6 transition-all duration-200 hover:bg-stone-900/80 hover:border-amber-900/40 hover:shadow-lg hover:shadow-amber-950/20">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 rounded-lg bg-amber-900/20 border border-amber-800/30 p-3">
                      <Icon className="h-6 w-6 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-stone-100 group-hover:text-amber-400 transition-colors mb-1">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-stone-400 line-clamp-2 mb-3">
                          {category.description}
                        </p>
                      )}
                      <span className="text-xs text-stone-500">
                        {category._count.cases} 个案例
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-20">
            <FolderOpen className="h-12 w-12 text-stone-600 mx-auto mb-4" />
            <p className="text-stone-400">暂无分类</p>
          </div>
        )}
      </div>
    </div>
  );
}
