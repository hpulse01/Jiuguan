"use client";

import Link from "next/link";
import {
  Flame,
  TrendingUp,
  Briefcase,
  Heart,
  GraduationCap,
  Wallet,
  Code,
  ShoppingCart,
  Lightbulb,
  Users,
  Search,
  Tag,
  FolderOpen,
} from "lucide-react";

const hotTags = [
  { label: "创业失败", count: 328 },
  { label: "投资踩坑", count: 256 },
  { label: "职场教训", count: 214 },
  { label: "技术选型", count: 189 },
  { label: "合伙纠纷", count: 167 },
  { label: "产品失误", count: 145 },
  { label: "面试翻车", count: 132 },
  { label: "留学弯路", count: 118 },
];

const categories = [
  { href: "/categories/career", label: "职场与求职", icon: Briefcase, count: 542 },
  { href: "/categories/relationships", label: "人际关系", icon: Heart, count: 387 },
  { href: "/categories/education", label: "教育与学习", icon: GraduationCap, count: 298 },
  { href: "/categories/finance", label: "理财与投资", icon: Wallet, count: 445 },
  { href: "/categories/tech", label: "技术与开发", icon: Code, count: 356 },
  { href: "/categories/business", label: "创业与商业", icon: ShoppingCart, count: 523 },
  { href: "/categories/decisions", label: "人生决策", icon: Lightbulb, count: 267 },
  { href: "/categories/social", label: "社交与沟通", icon: Users, count: 198 },
];

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-[calc(3.5rem+1.5rem)] space-y-6">
        {/* Hot Tags */}
        <section className="tavern-card">
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-4 w-4 text-warm-500" />
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              热门标签
            </h3>
            <TrendingUp className="ml-auto h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          </div>
          <div className="flex flex-wrap gap-2">
            {hotTags.map((tag) => (
              <Link
                key={tag.label}
                href={`/tags/${encodeURIComponent(tag.label)}`}
                className="group inline-flex items-center gap-1 rounded-full border border-tavern-800 bg-tavern-950/50 px-2.5 py-1 text-xs transition-all hover:border-tavern-600 hover:bg-tavern-900"
              >
                <Tag className="h-3 w-3 text-tavern-500 transition-colors group-hover:text-warm-500" />
                <span className="text-tavern-300 transition-colors group-hover:text-tavern-100">
                  {tag.label}
                </span>
                <span className="text-tavern-700 transition-colors group-hover:text-tavern-500">
                  {tag.count}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="tavern-card">
          <div className="mb-3 flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-warm-500" />
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              分类导航
            </h3>
          </div>
          <nav className="space-y-0.5">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.href}
                  href={category.href}
                  className="group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-[var(--accent)]"
                >
                  <Icon className="h-4 w-4 shrink-0 text-tavern-500 transition-colors group-hover:text-warm-500" />
                  <span className="text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--foreground)]">
                    {category.label}
                  </span>
                  <span className="ml-auto text-xs text-tavern-700 transition-colors group-hover:text-tavern-500">
                    {category.count}
                  </span>
                </Link>
              );
            })}
          </nav>
        </section>

        {/* CTA Section */}
        <section className="overflow-hidden rounded-lg border border-tavern-800 bg-gradient-to-br from-tavern-900 via-tavern-950 to-[#0f0d0a] p-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-600/20">
              <Search className="h-5 w-5 text-warm-500" />
            </div>
            <h3 className="text-sm font-semibold text-tavern-100">
              做决定前先查一查
            </h3>
            <p className="text-xs leading-relaxed text-tavern-400">
              别人踩过的坑，你不必再踩。搜索相关经历，做更明智的决策。
            </p>
            <Link
              href="/search"
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-md bg-warm-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-warm-700"
            >
              <Search className="h-3.5 w-3.5" />
              搜索经验
            </Link>
          </div>
        </section>
      </div>
    </aside>
  );
}
