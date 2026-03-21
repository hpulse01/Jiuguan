export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { CaseInteractions } from "@/components/case-interactions";
import { CommentsSection } from "@/components/comments-section";
import { CaseCard } from "@/components/case-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Eye,
  Calendar,
  User,
  ArrowLeft,
  Clock,
  Target,
  Crosshair,
  Zap,
  EyeOff,
  Bell,
  CheckCircle2,
  DollarSign,
  Timer,
  Heart,
  Lightbulb,
  Search,
  RotateCcw,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

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

  // Only published cases are publicly visible, unless the viewer is the author or admin/mod
  if (
    failureCase.status !== "PUBLISHED" &&
    failureCase.authorId !== session?.user?.id &&
    session?.user?.role !== "ADMIN" &&
    session?.user?.role !== "MODERATOR"
  ) {
    notFound();
  }

  // Increment view count
  await db.failureCase.update({
    where: { slug },
    data: { viewCount: { increment: 1 } },
  });

  // Check user interaction state
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

  // Format comments for client component (handle anonymous)
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
        {/* Title & Summary */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-50 leading-tight mb-4">
            {failureCase.title}
          </h1>
          <p className="text-lg text-stone-300 leading-relaxed border-l-4 border-amber-600/50 pl-4 italic">
            {failureCase.summary}
          </p>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
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

        {/* Warning Box - Key Highlights */}
        <Card className="border-amber-900/50 bg-amber-950/20 mb-10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-400 text-lg">
              <AlertTriangle className="h-5 w-5" />
              关键警示
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-stone-900/50 border border-stone-800/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <Bell className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-400">
                    最早预警信号
                  </span>
                </div>
                <p className="text-sm text-stone-300 leading-relaxed">
                  {failureCase.earliestWarning.length > 150
                    ? failureCase.earliestWarning.slice(0, 150) + "..."
                    : failureCase.earliestWarning}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-stone-900/50 border border-stone-800/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <EyeOff className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">
                    最大误判
                  </span>
                </div>
                <p className="text-sm text-stone-300 leading-relaxed">
                  {failureCase.ignoredSignals.length > 150
                    ? failureCase.ignoredSignals.slice(0, 150) + "..."
                    : failureCase.ignoredSignals}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-stone-900/50 border border-stone-800/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <DollarSign className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-medium text-orange-400">
                    最大代价
                  </span>
                </div>
                <p className="text-sm text-stone-300 leading-relaxed">
                  {[
                    failureCase.costTime && `时间: ${failureCase.costTime}`,
                    failureCase.costMoney && `金钱: ${failureCase.costMoney}`,
                    failureCase.costRelationship &&
                      `关系: ${failureCase.costRelationship}`,
                    failureCase.costOpportunity &&
                      `机会: ${failureCase.costOpportunity}`,
                  ]
                    .filter(Boolean)
                    .join("；") || failureCase.outcome.slice(0, 150)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-stone-900/50 border border-stone-800/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <Lightbulb className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">
                    最关键建议
                  </span>
                </div>
                <p className="text-sm text-stone-300 leading-relaxed">
                  {failureCase.adviceToOthers.length > 150
                    ? failureCase.adviceToOthers.slice(0, 150) + "..."
                    : failureCase.adviceToOthers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Full Content Sections */}
        <div className="space-y-8">
          <ContentSection
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            title="背景"
            content={failureCase.background}
          />

          <ContentSection
            icon={<Target className="h-5 w-5 text-amber-500" />}
            title="当时的目标"
            content={failureCase.originalGoal}
          />

          <ContentSection
            icon={<Crosshair className="h-5 w-5 text-amber-500" />}
            title="关键决策点"
            content={failureCase.decisionPoint}
          />

          <ContentSection
            icon={<Zap className="h-5 w-5 text-amber-500" />}
            title="做了什么"
            content={failureCase.actionsTaken}
          />

          <ContentSection
            icon={<EyeOff className="h-5 w-5 text-red-400" />}
            title="忽略了什么信号"
            content={failureCase.ignoredSignals}
          />

          <ContentSection
            icon={<Bell className="h-5 w-5 text-amber-400" />}
            title="最早的预警"
            content={failureCase.earliestWarning}
          />

          <ContentSection
            icon={<CheckCircle2 className="h-5 w-5 text-stone-400" />}
            title="最终结果"
            content={failureCase.outcome}
          />

          {/* 代价 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-orange-400" />
              <h2 className="text-xl font-semibold text-stone-100">
                代价（时间/金钱/关系/机会）
              </h2>
            </div>
            <Card className="border-stone-800/60 bg-stone-900/40">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {failureCase.costTime && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-stone-950/50">
                      <Timer className="h-4 w-4 text-stone-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs text-stone-500 block mb-1">
                          时间成本
                        </span>
                        <p className="text-sm text-stone-300">
                          {failureCase.costTime}
                        </p>
                      </div>
                    </div>
                  )}
                  {failureCase.costMoney && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-stone-950/50">
                      <DollarSign className="h-4 w-4 text-stone-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs text-stone-500 block mb-1">
                          金钱成本
                        </span>
                        <p className="text-sm text-stone-300">
                          {failureCase.costMoney}
                        </p>
                      </div>
                    </div>
                  )}
                  {failureCase.costRelationship && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-stone-950/50">
                      <Heart className="h-4 w-4 text-stone-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs text-stone-500 block mb-1">
                          关系成本
                        </span>
                        <p className="text-sm text-stone-300">
                          {failureCase.costRelationship}
                        </p>
                      </div>
                    </div>
                  )}
                  {failureCase.costOpportunity && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-stone-950/50">
                      <Lightbulb className="h-4 w-4 text-stone-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs text-stone-500 block mb-1">
                          机会成本
                        </span>
                        <p className="text-sm text-stone-300">
                          {failureCase.costOpportunity}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {!failureCase.costTime &&
                  !failureCase.costMoney &&
                  !failureCase.costRelationship &&
                  !failureCase.costOpportunity && (
                    <p className="text-sm text-stone-500 italic">
                      作者未详细列出具体代价
                    </p>
                  )}
              </CardContent>
            </Card>
          </div>

          <ContentSection
            icon={<Search className="h-5 w-5 text-amber-500" />}
            title="根因分析"
            content={failureCase.rootCause}
          />

          <ContentSection
            icon={<RotateCcw className="h-5 w-5 text-amber-500" />}
            title="如果重来"
            content={failureCase.whatWouldDoDifferently}
          />

          {/* 给后来者的建议 - special styling */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-green-400" />
              <h2 className="text-xl font-semibold text-stone-100">
                给后来者的建议
              </h2>
            </div>
            <Card className="border-green-900/30 bg-green-950/10">
              <CardContent className="pt-6">
                <p className="text-stone-200 leading-relaxed whitespace-pre-wrap">
                  {failureCase.adviceToOthers}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

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
                  同类案例
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

function ContentSection({
  icon,
  title,
  content,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-xl font-semibold text-stone-100">{title}</h2>
      </div>
      <Card className="border-stone-800/60 bg-stone-900/40">
        <CardContent className="pt-6">
          <p className="text-stone-200 leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
