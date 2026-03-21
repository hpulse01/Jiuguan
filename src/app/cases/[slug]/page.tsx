export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { CaseInteractions } from "@/components/case-interactions";
import { CommentsSection } from "@/components/comments-section";
import { CaseCard } from "@/components/case-card";
import { FailureTimeline } from "@/components/failure-timeline";
import { CostVisualization } from "@/components/cost-visualization";
import { MisjudgmentWarning } from "@/components/misjudgment-warning";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  Calendar,
  User,
  ArrowLeft,
  DollarSign,
  Search,
  RotateCcw,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Map,
} from "lucide-react";
import { ReadingLayerToggle } from "./reading-layer-toggle";

async function getCase(slug: string) {
  const failureCase = await db.failureCase.findUnique({
    where: { slug },
    include: {
      author: {
        include: { profile: true },
      },
      category: true,
      tags: {
        include: { tag: true },
      },
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            include: { profile: true },
          },
          _count: {
            select: { likes: true },
          },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              author: {
                include: { profile: true },
              },
              _count: {
                select: { likes: true },
              },
            },
          },
        },
      },
      _count: {
        select: {
          usefulVotes: true,
          resonanceVotes: true,
          bookmarks: true,
          comments: true,
        },
      },
    },
  });

  return failureCase;
}

async function getSimilarCases(categoryId: string, currentCaseId: string) {
  return db.failureCase.findMany({
    where: {
      status: "PUBLISHED",
      categoryId,
      id: { not: currentCaseId },
    },
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
    take: 4,
  });
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const failureCase = await getCase(slug);

  if (!failureCase) {
    notFound();
  }

  if (
    failureCase.status !== "PUBLISHED" &&
    failureCase.authorId !== session?.user?.id &&
    session?.user?.role !== "ADMIN" &&
    session?.user?.role !== "MODERATOR"
  ) {
    notFound();
  }

  await db.failureCase.update({
    where: { slug },
    data: { viewCount: { increment: 1 } },
  });

  let userInteraction = {
    hasVotedUseful: false,
    hasVotedResonance: false,
    hasBookmarked: false,
  };

  if (session?.user?.id) {
    const [usefulVote, resonanceVote, bookmark] = await Promise.all([
      db.caseUsefulVote.findUnique({
        where: {
          userId_caseId: {
            userId: session.user.id,
            caseId: failureCase.id,
          },
        },
      }),
      db.caseResonanceVote.findUnique({
        where: {
          userId_caseId: {
            userId: session.user.id,
            caseId: failureCase.id,
          },
        },
      }),
      db.bookmark.findUnique({
        where: {
          userId_caseId: {
            userId: session.user.id,
            caseId: failureCase.id,
          },
        },
      }),
    ]);
    userInteraction = {
      hasVotedUseful: !!usefulVote,
      hasVotedResonance: !!resonanceVote,
      hasBookmarked: !!bookmark,
    };
  }

  const similarCases = await getSimilarCases(
    failureCase.categoryId,
    failureCase.id
  );

  const authorName = failureCase.isAnonymous
    ? "匿名用户"
    : failureCase.author.profile?.nickname || failureCase.author.username;
  const authorAvatar = failureCase.isAnonymous
    ? null
    : failureCase.author.profile?.avatar;

  const formattedComments = failureCase.comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    author: c.isAnonymous
      ? {
          id: c.author.id,
          username: "匿名用户",
          profile: { nickname: "匿名用户", avatar: null },
        }
      : {
          id: c.author.id,
          username: c.author.username,
          profile: {
            nickname: c.author.profile?.nickname || null,
            avatar: c.author.profile?.avatar || null,
          },
        },
    replies: c.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      author: r.isAnonymous
        ? {
            id: r.author.id,
            username: "匿名用户",
            profile: { nickname: "匿名用户", avatar: null },
          }
        : {
            id: r.author.id,
            username: r.author.username,
            profile: {
              nickname: r.author.profile?.nickname || null,
              avatar: r.author.profile?.avatar || null,
            },
          },
    })),
  }));

  const viewCount = failureCase.viewCount + 1;

  return (
    <div className="min-h-screen bg-[#0f0d0a]">
      {/* Header navigation */}
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
        <Link
          href="/cases"
          className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回案例列表
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-20">
        {/* ===== LAYER 1: Quick Summary (一眼看懂) ===== */}
        <section className="mb-10">
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-50 leading-tight mb-4">
            {failureCase.title}
          </h1>

          {/* Summary quote */}
          <p className="text-lg text-stone-300 leading-relaxed border-l-4 border-amber-600/50 pl-4 italic mb-6">
            {failureCase.summary}
          </p>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge variant="default" className="text-sm">
              {failureCase.category.name}
            </Badge>
            {failureCase.tags.map((t) => (
              <Badge key={t.tag.id} variant="secondary" className="text-sm">
                {t.tag.name}
              </Badge>
            ))}
            <Separator orientation="vertical" className="h-5 bg-stone-700" />
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                {authorAvatar ? (
                  <AvatarImage src={authorAvatar} alt={authorName} />
                ) : null}
                <AvatarFallback className="text-xs bg-stone-800">
                  {failureCase.isAnonymous ? (
                    <User className="h-3 w-3 text-stone-500" />
                  ) : (
                    authorName.charAt(0).toUpperCase()
                  )}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-stone-300">{authorName}</span>
            </div>
            <Separator orientation="vertical" className="h-5 bg-stone-700" />
            <span className="flex items-center gap-1.5 text-sm text-stone-400">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(failureCase.publishedAt ?? failureCase.createdAt)}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-stone-400">
              <Eye className="h-3.5 w-3.5" />
              {viewCount} 次阅读
            </span>
          </div>

          {/* Misjudgment & Warning highlight module */}
          <MisjudgmentWarning
            ignoredSignals={failureCase.ignoredSignals}
            earliestWarning={failureCase.earliestWarning}
            adviceToOthers={failureCase.adviceToOthers}
          />
        </section>

        {/* Layer navigation hint */}
        <div className="flex items-center gap-2 text-xs text-stone-600 mb-6">
          <ChevronDown className="h-3 w-3" />
          <span>向下滚动查看完整故事</span>
        </div>

        {/* ===== LAYER 2: Structured Review (结构化复盘) ===== */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <Map className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-semibold text-stone-100">
              失败轨迹
            </h2>
            <span className="text-xs text-stone-600 ml-2">
              从起点到终点，这段弯路的完整脉络
            </span>
          </div>

          <FailureTimeline
            background={failureCase.background}
            originalGoal={failureCase.originalGoal}
            decisionPoint={failureCase.decisionPoint}
            actionsTaken={failureCase.actionsTaken}
            ignoredSignals={failureCase.ignoredSignals}
            earliestWarning={failureCase.earliestWarning}
            outcome={failureCase.outcome}
          />
        </section>

        {/* Cost Visualization */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-orange-400" />
            <h2 className="text-xl font-semibold text-stone-100">
              这杯酒的代价
            </h2>
          </div>

          <CostVisualization
            costTime={failureCase.costTime}
            costMoney={failureCase.costMoney}
            costRelationship={failureCase.costRelationship}
            costOpportunity={failureCase.costOpportunity}
          />
        </section>

        {/* Root Cause & Reflection */}
        <section className="mb-10 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Search className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold text-stone-100">根因分析</h2>
            </div>
            <div className="p-5 rounded-lg border border-stone-800/60 bg-stone-900/40">
              <p className="text-stone-200 leading-relaxed whitespace-pre-wrap">
                {failureCase.rootCause}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold text-stone-100">如果重来</h2>
            </div>
            <div className="p-5 rounded-lg border border-stone-800/60 bg-stone-900/40">
              <p className="text-stone-200 leading-relaxed whitespace-pre-wrap">
                {failureCase.whatWouldDoDifferently}
              </p>
            </div>
          </div>

          {/* Advice - special styling */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-5 w-5 text-green-400" />
              <h2 className="text-xl font-semibold text-stone-100">
                给后来者的建议
              </h2>
            </div>
            <div className="p-5 rounded-lg border border-green-900/30 bg-green-950/10">
              <p className="text-stone-200 leading-relaxed whitespace-pre-wrap">
                {failureCase.adviceToOthers}
              </p>
            </div>
          </div>
        </section>

        {/* ===== LAYER 3: Full Narrative (展开按钮控制) ===== */}
        <ReadingLayerToggle
          background={failureCase.background}
          originalGoal={failureCase.originalGoal}
          decisionPoint={failureCase.decisionPoint}
          actionsTaken={failureCase.actionsTaken}
          ignoredSignals={failureCase.ignoredSignals}
          earliestWarning={failureCase.earliestWarning}
          outcome={failureCase.outcome}
        />

        <Separator className="my-10 bg-stone-800" />

        {/* Interaction Bar */}
        <CaseInteractions
          caseSlug={slug}
          initialCounts={{
            useful: failureCase._count.usefulVotes,
            resonance: failureCase._count.resonanceVotes,
            bookmarks: failureCase._count.bookmarks,
            comments: failureCase._count.comments,
          }}
          initialUserState={userInteraction}
        />

        <Separator className="my-10 bg-stone-800" />

        {/* Comments Section */}
        <CommentsSection
          caseSlug={slug}
          initialComments={formattedComments}
        />

        {/* Similar Cases */}
        {similarCases.length > 0 && (
          <>
            <Separator className="my-10 bg-stone-800" />
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-stone-100">
                  同类案例 · 别人也在这里摔过
                </h2>
                <Link
                  href={`/cases?category=${failureCase.category.slug}`}
                  className="text-sm text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
                >
                  查看更多
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {similarCases.map((c) => (
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
                    createdAt={c.publishedAt ?? c.createdAt}
                    usefulCount={c._count.usefulVotes}
                    resonanceCount={c._count.resonanceVotes}
                    commentCount={c._count.comments}
                    bookmarkCount={c._count.bookmarks}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
