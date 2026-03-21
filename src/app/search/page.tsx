"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CaseCard } from "@/components/case-card";
import { Pagination } from "@/components/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CaseCardSkeletonGrid } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { Search, SlidersHorizontal, X } from "lucide-react";

type SortOption = "latest" | "hot" | "useful" | "resonance";

interface CaseResult {
  id: string;
  slug: string;
  title: string;
  summary: string;
  isAnonymous: boolean;
  publishedAt: string;
  createdAt: string;
  category: { name: string };
  tags: { tag: { name: string } }[];
  author: {
    username: string;
    profile?: { nickname?: string; avatar?: string } | null;
  };
  _count: {
    usefulVotes: number;
    resonanceVotes: number;
    comments: number;
    bookmarks: number;
  };
}

const PAGE_SIZE = 12;

const sortOptions: { key: SortOption; label: string }[] = [
  { key: "latest", label: "最新" },
  { key: "hot", label: "最热" },
  { key: "useful", label: "最有用" },
  { key: "resonance", label: "最共鸣" },
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get("q") || "";
  const initialSort = (searchParams.get("sort") as SortOption) || "latest";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialCategoryId = searchParams.get("categoryId") || "";

  const [query, setQuery] = useState(initialQ);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [page, setPage] = useState(initialPage);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [cases, setCases] = useState<CaseResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<
    { id: string; name: string; slug: string }[]
  >([]);

  // Fetch categories on mount
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      params.set("sort", sort);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (categoryId) params.set("categoryId", categoryId);

      const endpoint = query ? "/api/search" : "/api/cases";
      const res = await fetch(`${endpoint}?${params}`);
      const data = await res.json();

      if (query) {
        // Search API returns { results, total }
        setCases(data.results || []);
        setTotal(data.total || 0);
      } else {
        // Cases API returns { cases, total }
        setCases(data.cases || []);
        setTotal(data.total || 0);
      }
    } catch {
      setCases([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [query, sort, page, categoryId]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Sync URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (sort !== "latest") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    if (categoryId) params.set("categoryId", categoryId);
    const qs = params.toString();
    router.replace(`/search${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [query, sort, page, categoryId, router]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-stone-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-100 mb-2">搜索</h1>
          <p className="text-stone-400">
            做决定前先查一查，看看别人踩过什么坑
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索失败案例..."
                className="pl-10 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit">
              <Search className="h-4 w-4 mr-1.5" />
              搜索
            </Button>
          </div>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Sort tabs */}
          <div className="flex items-center gap-1 bg-stone-900/50 rounded-lg p-1 border border-stone-800/40">
            {sortOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setSort(opt.key);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  sort === opt.key
                    ? "bg-stone-800 text-stone-50 shadow-sm"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Category filter */}
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-stone-500" />
              <button
                onClick={() => {
                  setCategoryId("");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  !categoryId
                    ? "bg-amber-600 text-stone-50"
                    : "bg-stone-800 text-stone-400 hover:text-stone-200"
                }`}
              >
                全部
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategoryId(cat.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    categoryId === cat.id
                      ? "bg-amber-600 text-stone-50"
                      : "bg-stone-800 text-stone-400 hover:text-stone-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results info */}
        {!loading && (
          <p className="text-sm text-stone-500 mb-4">
            {query ? `搜索"${query}"，` : ""}共 {total} 个结果
          </p>
        )}

        {/* Results */}
        {loading ? (
          <CaseCardSkeletonGrid count={6} />
        ) : cases.length > 0 ? (
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
                createdAt={new Date(c.publishedAt || c.createdAt)}
                usefulCount={c._count.usefulVotes}
                resonanceCount={c._count.resonanceVotes}
                commentCount={c._count.comments}
                bookmarkCount={c._count.bookmarks}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="没有找到相关案例"
            description={query ? `没有找到与"${query}"相关的案例，试试其他关键词` : "暂无案例"}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
