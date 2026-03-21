import { db } from "@/lib/db";
import { CaseCard } from "@/components/case-card";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Sparkles,
  Clock,
  ThumbsUp,
  Heart,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "发现 - 酒馆",
  description: "发现精选失败案例，从他人的经历中获得启发",
};

// Helper to format case data for CaseCard
function formatCase(c: any) {
  return {
    slug: c.slug,
    title: c.title,
    summary: c.summary,
    categoryName: c.category.name,
    tags: c.tags.map((t: any) => t.tag.name),
    authorName: c.isAnonymous
      ? "匿名"
      : c.author.profile?.nickname || c.author.username,
    authorAvatar: c.isAnonymous ? undefined : c.author.profile?.avatar ?? undefined,
    isAnonymous: c.isAnonymous,
    createdAt: c.publishedAt || c.createdAt,
    usefulCount: c._count.usefulVotes,
    resonanceCount: c._count.resonanceVotes,
    commentCount: c._count.comments,
    bookmarkCount: c._count.bookmarks,
  };
}

const caseInclude = {
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
} as const;

async function getFeaturedCases() {
  return db.failureCase.findMany({
    where: { status: "PUBLISHED", isFeatured: true },
    orderBy: { publishedAt: "desc" },
    take: 6,
    include: caseInclude,
  });
}

async function getLatestCases() {
  return db.failureCase.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 6,
    include: caseInclude,
  });
}

async function getMostUsefulCases() {
  return db.failureCase.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { usefulVotes: { _count: "desc" } },
    take: 6,
    include: caseInclude,
  });
}

async function getMostResonanceCases() {
  return db.failureCase.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { resonanceVotes: { _count: "desc" } },
    take: 6,
    include: caseInclude,
  });
}

async function getCuratedCases() {
  // Curated: featured cases ordered by view count (beginner-friendly popular ones)
  return db.failureCase.findMany({
    where: { status: "PUBLISHED", isFeatured: true },
    orderBy: { viewCount: "desc" },
    take: 6,
    include: caseInclude,
  });
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  cases: any[];
  moreHref: string;
  moreLabel?: string;
}

function Section({
  icon,
  title,
  cases,
  moreHref,
  moreLabel = "查看更多",
}: SectionProps) {
  if (cases.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-stone-100">
          {icon}
          {title}
        </h2>
        <Link
          href={moreHref}
          className="flex items-center gap-1 text-sm text-amber-500 hover:text-amber-400 transition-colors"
        >
          {moreLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cases.map((c) => {
          const props = formatCase(c);
          return <CaseCard key={c.id} {...props} />;
        })}
      </div>
    </section>
  );
}

export default async function DiscoverPage() {
  const [featured, latest, useful, resonance, curated] = await Promise.all([
    getFeaturedCases(),
    getLatestCases(),
    getMostUsefulCases(),
    getMostResonanceCases(),
    getCuratedCases(),
  ]);

  return (
    <div className="min-h-screen bg-stone-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-stone-100 mb-2">
            发现
          </h1>
          <p className="text-stone-400">
            探索来自各行各业的真实失败复盘，在别人的故事里找到自己的答案
          </p>
        </div>

        <div className="space-y-14">
          <Section
            icon={<Sparkles className="h-5 w-5 text-amber-500" />}
            title="今日推荐"
            cases={featured}
            moreHref="/search?featured=true"
          />

          <Section
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            title="最新发布"
            cases={latest}
            moreHref="/search?sort=latest"
          />

          <Section
            icon={<ThumbsUp className="h-5 w-5 text-amber-500" />}
            title="高价值复盘"
            cases={useful}
            moreHref="/search?sort=useful"
          />

          <Section
            icon={<Heart className="h-5 w-5 text-amber-500" />}
            title="最近共鸣最多"
            cases={resonance}
            moreHref="/search?sort=resonance"
          />

          <Section
            icon={<GraduationCap className="h-5 w-5 text-amber-500" />}
            title="新手必看"
            cases={curated}
            moreHref="/search?featured=true&sort=useful"
          />
        </div>
      </div>
    </div>
  );
}
