import { db } from "@/lib/db";
import { CaseCard } from "@/components/case-card";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "所有案例 - 酒馆",
  description: "浏览所有失败案例，从真实经历中学习",
};

const PAGE_SIZE = 12;

type SortOption = "latest" | "hot" | "useful";

function getSortOrder(sort: SortOption) {
  switch (sort) {
    case "hot":
      return [
        { viewCount: "desc" as const },
        { publishedAt: "desc" as const },
      ];
    case "useful":
      return [
        { usefulVotes: { _count: "desc" as const } },
        { publishedAt: "desc" as const },
      ];
    case "latest":
    default:
      return [{ publishedAt: "desc" as const }];
  }
}

interface PageProps {
  searchParams: Promise<{ sort?: string; page?: string; category?: string }>;
}

export default async function CasesPage({ searchParams }: PageProps) {
  const { sort: sortParam, page: pageParam, category } = await searchParams;

  const sort = (["latest", "hot", "useful"].includes(sortParam || "")
    ? sortParam
    : "latest") as SortOption;
  const page = Math.max(1, parseInt(pageParam || "1", 10));

  const where: Record<string, unknown> = { status: "PUBLISHED" as const };

  // Filter by category slug if provided
  if (category) {
    const cat = await db.category.findUnique({ where: { slug: category } });
    if (cat) where.categoryId = cat.id;
  }

  const [cases, total, categories] = await Promise.all([
    db.failureCase.findMany({
      where,
      orderBy: getSortOrder(sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        author: { include: { profile: true } },
        category: true,
        tags: { include: { tag: true } },
        _count: {
          select: {
            usefulVotes: true,
            resonanceVotes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    }),
    db.failureCase.count({ where }),
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { cases: true } } },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const sortTabs: { key: SortOption; label: string }[] = [
    { key: "latest", label: "最新" },
    { key: "hot", label: "最热" },
    { key: "useful", label: "最有用" },
  ];

  return (
    <div className="min-h-screen bg-stone-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-stone-100 mb-2">
              所有案例
            </h1>
            <p className="text-stone-400">
              共 {total} 个已发布的失败复盘案例
            </p>
          </div>
          <Link
            href="/publish"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-stone-50 text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            分享案例
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Category filter pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <Link
              href={`/cases?sort=${sort}&page=1`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !category
                  ? "bg-amber-600 text-stone-50"
                  : "bg-stone-800 text-stone-400 hover:text-stone-200"
              }`}
            >
              全部
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/cases?sort=${sort}&page=1&category=${cat.slug}`}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  category === cat.slug
                    ? "bg-amber-600 text-stone-50"
                    : "bg-stone-800 text-stone-400 hover:text-stone-200"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Sort tabs */}
        <div className="flex items-center gap-1 mb-6 bg-stone-900/50 rounded-lg p-1 w-fit border border-stone-800/40">
          {sortTabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/cases?sort=${tab.key}&page=1${category ? `&category=${category}` : ""}`}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                sort === tab.key
                  ? "bg-stone-800 text-stone-50 shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Case grid */}
        {cases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cases.map((c) => (
              <CaseCard
                key={c.id}
                slug={c.slug}
                title={c.title}
                summary={c.summary}
                categoryName={c.category.name}
                tags={c.tags.map((t) => t.tag.name)}
                authorName={
                  c.isAnonymous
                    ? "匿名"
                    : c.author.profile?.nickname || c.author.username
                }
                authorAvatar={
                  c.isAnonymous
                    ? undefined
                    : c.author.profile?.avatar ?? undefined
                }
                isAnonymous={c.isAnonymous}
                createdAt={c.publishedAt || c.createdAt}
                usefulCount={c._count.usefulVotes}
                resonanceCount={c._count.resonanceVotes}
                commentCount={c._count.comments}
                bookmarkCount={c._count.bookmarks}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <FileText className="h-12 w-12 text-stone-600 mx-auto mb-4" />
            <p className="text-lg text-stone-300 mb-1">暂无案例</p>
            <p className="text-sm text-stone-500">
              还没有发布的案例，来{" "}
              <Link href="/publish" className="text-amber-500 hover:text-amber-400">
                分享你的经历
              </Link>{" "}
              吧
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-2 mt-10">
            {page > 1 && (
              <Link
                href={`/cases?sort=${sort}&page=${page - 1}${category ? `&category=${category}` : ""}`}
                className="px-4 py-2 rounded-md text-sm border border-stone-700 bg-transparent text-stone-200 hover:bg-stone-800 transition-colors"
              >
                上一页
              </Link>
            )}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true;
                  if (p === 1 || p === totalPages) return true;
                  if (Math.abs(p - page) <= 1) return true;
                  return false;
                })
                .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                    acc.push("ellipsis");
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "ellipsis" ? (
                    <span key={`e-${idx}`} className="px-2 text-stone-500">
                      ...
                    </span>
                  ) : (
                    <Link
                      key={p}
                      href={`/cases?sort=${sort}&page=${p}${category ? `&category=${category}` : ""}`}
                      className={`h-9 w-9 flex items-center justify-center rounded-md text-sm transition-colors ${
                        page === p
                          ? "bg-amber-600 text-stone-50"
                          : "text-stone-300 hover:bg-stone-800"
                      }`}
                    >
                      {p}
                    </Link>
                  )
                )}
            </div>
            {page < totalPages && (
              <Link
                href={`/cases?sort=${sort}&page=${page + 1}${category ? `&category=${category}` : ""}`}
                className="px-4 py-2 rounded-md text-sm border border-stone-700 bg-transparent text-stone-200 hover:bg-stone-800 transition-colors"
              >
                下一页
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
