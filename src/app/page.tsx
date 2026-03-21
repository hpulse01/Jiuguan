export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";
import { CaseCard } from "@/components/case-card";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Wine,
  Search,
  TrendingUp,
  Users,
  MessageCircle,
  FileText,
  ArrowRight,
  Sparkles,
  Clock,
  Flame,
} from "lucide-react";

async function getFeaturedCases() {
  return db.failureCase.findMany({
    where: { status: "PUBLISHED", isFeatured: true },
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
    orderBy: { publishedAt: "desc" },
    take: 6,
  });
}

async function getLatestCases() {
  return db.failureCase.findMany({
    where: { status: "PUBLISHED" },
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
    orderBy: { publishedAt: "desc" },
    take: 8,
  });
}

async function getHotTags() {
  return db.tag.findMany({
    include: {
      _count: { select: { cases: true } },
    },
    orderBy: { cases: { _count: "desc" } },
    take: 20,
  });
}

async function getCategories() {
  return db.category.findMany({
    include: {
      _count: { select: { cases: true } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

async function getStats() {
  const [totalCases, totalUsers, totalComments] = await Promise.all([
    db.failureCase.count({ where: { status: "PUBLISHED" } }),
    db.user.count(),
    db.comment.count(),
  ]);
  return { totalCases, totalUsers, totalComments };
}

export default async function HomePage() {
  const [featuredCases, latestCases, hotTags, categories, stats] =
    await Promise.all([
      getFeaturedCases(),
      getLatestCases(),
      getHotTags(),
      getCategories(),
      getStats(),
    ]);

  return (
    <div className="min-h-screen bg-[#0f0d0a]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-900/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-amber-800/10 rounded-full blur-[80px]" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-orange-900/8 rounded-full blur-[60px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 mb-8">
            <Wine className="h-12 w-12 text-amber-500" />
            <h1 className="text-6xl sm:text-7xl font-bold text-amber-500 tracking-tight">
              酒馆
            </h1>
          </div>

          <p className="text-2xl sm:text-3xl font-semibold text-stone-100 mb-4 max-w-3xl mx-auto leading-relaxed">
            别人都在教你成功，酒馆告诉你如何避开失败
          </p>

          <p className="text-lg text-stone-400 mb-10 max-w-2xl mx-auto">
            一个坦诚分享失败经历的社区。在这里，每一段弯路都是路标，每一次跌倒都是经验。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="text-base px-8">
              <Link href="/cases">
                <FileText className="mr-2 h-5 w-5" />
                浏览失败案例
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8">
              <Link href="/publish">
                <Sparkles className="mr-2 h-5 w-5" />
                分享你的经历
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="relative max-w-3xl mx-auto px-4 -mt-4 mb-16">
        <Card className="border-stone-800/80 bg-stone-900/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <form action="/cases" method="GET">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <Input
                  name="q"
                  placeholder="做决定前先查一查...搜索失败案例、关键词"
                  className="pl-12 h-12 text-base bg-stone-950/50 border-stone-700/60 focus-visible:ring-amber-500/40"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  搜索
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Stats Section */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-3 gap-4 sm:gap-8">
          <div className="text-center p-6 rounded-xl bg-stone-900/40 border border-stone-800/50">
            <div className="flex items-center justify-center mb-2">
              <FileText className="h-5 w-5 text-amber-500 mr-2" />
              <span className="text-3xl sm:text-4xl font-bold text-stone-50">
                {stats.totalCases}
              </span>
            </div>
            <p className="text-sm text-stone-400">失败案例</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-stone-900/40 border border-stone-800/50">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-amber-500 mr-2" />
              <span className="text-3xl sm:text-4xl font-bold text-stone-50">
                {stats.totalUsers}
              </span>
            </div>
            <p className="text-sm text-stone-400">酒馆常客</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-stone-900/40 border border-stone-800/50">
            <div className="flex items-center justify-center mb-2">
              <MessageCircle className="h-5 w-5 text-amber-500 mr-2" />
              <span className="text-3xl sm:text-4xl font-bold text-stone-50">
                {stats.totalComments}
              </span>
            </div>
            <p className="text-sm text-stone-400">讨论交流</p>
          </div>
        </div>
      </section>

      {/* Featured Cases */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-stone-50">推荐案例</h2>
          </div>
          <Link
            href="/cases?sort=useful"
            className="text-sm text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
          >
            查看更多
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {featuredCases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredCases.map((c) => (
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
                authorAvatar={c.isAnonymous ? undefined : c.author.profile?.avatar ?? undefined}
                isAnonymous={c.isAnonymous}
                createdAt={c.publishedAt ?? c.createdAt}
                usefulCount={c._count.usefulVotes}
                resonanceCount={c._count.resonanceVotes}
                commentCount={c._count.comments}
                bookmarkCount={c._count.bookmarks}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="推荐位虚位以待"
            description="好的失败故事值得被看见，酒馆正在等待那个开口的人"
          />
        )}
      </section>

      {/* Latest Cases */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-stone-50">最新案例</h2>
          </div>
          <Link
            href="/cases?sort=latest"
            className="text-sm text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
          >
            查看更多
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {latestCases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {latestCases.map((c) => (
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
                authorAvatar={c.isAnonymous ? undefined : c.author.profile?.avatar ?? undefined}
                isAnonymous={c.isAnonymous}
                createdAt={c.publishedAt ?? c.createdAt}
                usefulCount={c._count.usefulVotes}
                resonanceCount={c._count.resonanceVotes}
                commentCount={c._count.comments}
                bookmarkCount={c._count.bookmarks}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="今夜的酒馆还很安静"
            description="每段弯路都值得被记录，坐下来，倒一杯，说说你的故事"
          />
        )}
      </section>

      {/* Hot Tags */}
      {hotTags.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Flame className="h-5 w-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-stone-50">热门标签</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {hotTags.map((tag) => (
              <Link key={tag.id} href={`/cases?tag=${tag.slug}`}>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-stone-700 transition-colors px-3 py-1.5 text-sm"
                >
                  {tag.name}
                  <span className="ml-1.5 text-stone-500 text-xs">
                    {tag._count.cases}
                  </span>
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mb-20">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-stone-50">分类浏览</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link key={category.id} href={`/cases?category=${category.slug}`}>
                <Card className="border-stone-800/60 bg-stone-900/40 hover:bg-stone-900/70 hover:border-amber-900/40 transition-all duration-200 cursor-pointer group">
                  <CardHeader className="p-5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base text-stone-100 group-hover:text-amber-400 transition-colors">
                        {category.icon && (
                          <span className="mr-2">{category.icon}</span>
                        )}
                        {category.name}
                      </CardTitle>
                      <span className="text-xs text-stone-500">
                        {category._count.cases} 例
                      </span>
                    </div>
                    {category.description && (
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-900/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold text-stone-50 mb-4">
            你的失败，是别人的路标
          </h2>
          <p className="text-stone-400 mb-8 text-lg">
            坦诚地分享一次失败经历，可能帮助无数人绕过同样的弯路
          </p>
          <Button asChild size="lg" className="text-base px-10">
            <Link href="/publish">
              开始分享
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
