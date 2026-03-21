export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { CaseCard } from "@/components/case-card";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, FolderOpen } from "lucide-react";

const PAGE_SIZE = 12;

type SortOption = "latest" | "hot" | "useful";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await db.category.findUnique({ where: { slug } });

  if (!category) return { title: "分类未找到 - 酒馆" };

  return {
    title: `${category.name} - 分类 - 酒馆`,
    description: category.description || `浏览「${category.name}」分类下的失败案例`,
  };
}

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

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { sort: sortParam, page: pageParam } = await searchParams;

  const sort = (["latest", "hot", "useful"].includes(sortParam || "")
    ? sortParam
    : "latest") as SortOption;
  const page = Math.max(1, parseInt(pageParam || "1", 10));

  const category = await db.category.findUnique({
    where: { slug },
  });

  if (!category) {
    notFound();
  }

  const where = {
    status: "PUBLISHED" as const,
    categoryId: category.id,
  };

  const [cases, total] = await Promise.all([
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
        {/* Back link */}
        <Link
          href="/categories"
          className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-amber-400 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          返回分类
        </Link>

        {/* Category header */}
        <div className="mb-8 pb-6 border-b border-stone-800/60">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-amber-900/20 border border-amber-800/30 p-2">
              <FolderOpen className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-100">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-stone-400 mt-1">{category.description}</p>
              )}
            </div>
          </div>
          <p className="text-sm text-stone-500 mt-3">
            共 {total} 个案例
          </p>
        </div>

        {/* Sort tabs */}
        <div className="flex items-center gap-1 mb-6 bg-stone-900/50 rounded-lg p-1 w-fit border border-stone-800/40">
          {sortTabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/categories/${slug}?sort=${tab.key}&page=1`}
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
                categoryName={c.category?.name ?? ""}
                tags={c.tags.map((t) => t.tag.name)}
                authorName={
                  c.isAnonymous
                    ? "匿名"
                    : c.author.profile?.nickname || c.author.username
                }
                authorAvatar={
                  c.isAnonymous ? undefined : c.author.profile?.avatar ?? undefined
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
            <FolderOpen className="h-12 w-12 text-stone-600 mx-auto mb-4" />
            <p className="text-lg text-stone-300 mb-1">暂无案例</p>
            <p className="text-sm text-stone-500">
              这个分类下还没有发布的案例
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-2 mt-10">
            {page > 1 && (
              <Link
                href={`/categories/${slug}?sort=${sort}&page=${page - 1}`}
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
                    <span
                      key={`e-${idx}`}
                      className="px-2 text-stone-500"
                    >
                      ...
                    </span>
                  ) : (
                    <Link
                      key={p}
                      href={`/categories/${slug}?sort=${sort}&page=${p}`}
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
                href={`/categories/${slug}?sort=${sort}&page=${page + 1}`}
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
