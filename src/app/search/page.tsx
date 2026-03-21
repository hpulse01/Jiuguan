"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CaseCard } from "@/components/case-card";
import { Pagination } from "@/components/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CaseCardSkeletonGrid } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { Search, SlidersHorizontal, X, Tag } from "lucide-react";

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
  tags: { id: string; name: string }[];
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

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-950 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-600 border-t-amber-500" /></div>}>
      <SearchPage />
    </Suspense>
  );
}

function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get("q") || "";
  const initialSort = (searchParams.get("sort") as SortOption) || "latest";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialCategoryId = searchParams.get("categoryId") || "";
  const initialTagIds = searchParams.get("tagIds") || "";

  const [query, setQuery] = useState(initialQ);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [page, setPage] = useState(initialPage);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialTagIds ? initialTagIds.split(",") : []
  );
  const [cases, setCases] = useState<CaseResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [allTags, setAllTags] = useState<{ id: string; name: string }[]>([]);
  const [showTagFilter, setShowTagFilter] = useState(!!initialTagIds);

  // Fetch categories and tags on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/tags").then((r) => r.json()),
    ]).then(([cats, tgs]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setAllTags(Array.isArray(tgs) ? tgs : []);
    }).catch(() => {});
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
      if (selectedTagIds.length > 0) params.set("tagIds", selectedTagIds.join(","));

      // 统一使用 search API（支持无关键词搜索）
      const endpoint = query ? "/api/search" : "/api/cases";
      const res = await fetch(`${endpoint}?${params}`);
      const data = await res.json();

      setCases(data.cases || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      setCases([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [query, sort, page, categoryId, selectedTagIds]);

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
    if (selectedTagIds.length > 0) params.set("tagIds", selectedTagIds.join(","));
    const qs = params.toString();
    router.replace(`/search${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [query, sort, page, categoryId, selectedTagIds, router]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
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
                placeholder="搜索标题、正文、标签..."
                className="pl-10 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); setPage(1); }}
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
        <div className="space-y-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Sort tabs */}
            <div className="flex items-center gap-1 bg-stone-900/50 rounded-lg p-1 border border-stone-800/40">
              {sortOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setSort(opt.key); setPage(1); }}
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

            {/* Tag filter toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTagFilter(!showTagFilter)}
              className={`border-stone-700 ${showTagFilter ? "text-amber-400" : "text-stone-400"}`}
            >
              <Tag className="h-3.5 w-3.5 mr-1.5" />
              标签筛选
              {selectedTagIds.length > 0 && (
                <span className="ml-1.5 bg-amber-600 text-white text-xs rounded-full px-1.5">{selectedTagIds.length}</span>
              )}
            </Button>
          </div>

          {/* Category filter */}
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-stone-500" />
              <button
                onClick={() => { setCategoryId(""); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  !categoryId
                    ? "bg-amber-600 text-stone-50"
                    : "bg-stone-800 text-stone-400 hover:text-stone-200"
                }`}
              >
                全部分类
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setCategoryId(cat.id); setPage(1); }}
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

          {/* Tag filter */}
          {showTagFilter && allTags.length > 0 && (
            <div className="p-3 rounded-lg border border-stone-800/40 bg-stone-900/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-stone-500">选择标签组合筛选</span>
                {selectedTagIds.length > 0 && (
                  <button
                    onClick={() => { setSelectedTagIds([]); setPage(1); }}
                    className="text-xs text-stone-500 hover:text-amber-400"
                  >
                    清除
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedTagIds.includes(tag.id)
                        ? "bg-amber-600 text-stone-50"
                        : "bg-stone-800 text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    {tag.name}
                    {selectedTagIds.includes(tag.id) && <X className="inline h-3 w-3 ml-0.5" />}
                  </button>
                ))}
              </div>
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
                tags={c.tags.map((t) => t.name)}
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
            icon={Search}
            title="这条路还没人走过"
            description={
              query
                ? `没有找到关于"${query}"的前车之鉴，换个关键词试试？`
                : selectedTagIds.length > 0
                  ? "这个标签组合还没有故事，试试减少标签范围"
                  : "酒馆里暂时没有故事，但不会太久"
            }
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
