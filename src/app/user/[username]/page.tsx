export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FollowButton } from "@/components/follow-button";
import { EmptyState } from "@/components/empty-state";
import {
  MapPin,
  LinkIcon,
  CalendarDays,
  ThumbsUp,
  Heart,
  MessageCircle,
  Bookmark,
  Settings,
  FileText,
} from "lucide-react";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await db.user.findUnique({
    where: { username },
    include: { profile: true },
  });

  if (!user) return { title: "用户不存在 - 酒馆" };

  const displayName = user.profile?.nickname || user.username;
  return {
    title: `${displayName} - 酒馆`,
    description: user.profile?.bio || `${displayName}的个人主页`,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;

  const user = await db.user.findUnique({
    where: { username },
    include: {
      profile: true,
      cases: {
        where: { status: "PUBLISHED" },
        include: {
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
      },
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) notFound();

  const session = await auth();
  const isOwnProfile = session?.user?.id === user.id;

  let isFollowing = false;
  if (session?.user && !isOwnProfile) {
    const follow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: user.id,
        },
      },
    });
    isFollowing = !!follow;
  }

  const totalUseful = user.cases.reduce(
    (sum, c) => sum + c._count.usefulVotes,
    0
  );
  const totalResonance = user.cases.reduce(
    (sum, c) => sum + c._count.resonanceVotes,
    0
  );

  const displayName = user.profile?.nickname || user.username;

  return (
    <div className="min-h-screen bg-stone-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-stone-900/50 border border-stone-800/60 rounded-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="h-24 w-24 border-2 border-stone-700">
              {user.profile?.avatar ? (
                <AvatarImage src={user.profile.avatar} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-2xl bg-stone-800 text-stone-300">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-stone-100">
                  {displayName}
                </h1>
                <span className="text-sm text-stone-500">@{user.username}</span>
              </div>

              {user.profile?.bio && (
                <p className="mt-2 text-stone-400 text-sm leading-relaxed">
                  {user.profile.bio}
                </p>
              )}

              <div className="flex items-center gap-4 mt-3 text-sm text-stone-500 flex-wrap">
                {user.profile?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {user.profile.location}
                  </span>
                )}
                {user.profile?.website && (
                  <a
                    href={user.profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-amber-500 hover:text-amber-400 transition-colors"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    {user.profile.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(user.createdAt).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                  })}
                  加入
                </span>
              </div>

              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm">
                  <strong className="text-stone-200">{user._count.following}</strong>
                  <span className="text-stone-500 ml-1">关注</span>
                </span>
                <span className="text-sm">
                  <strong className="text-stone-200">{user._count.followers}</strong>
                  <span className="text-stone-500 ml-1">粉丝</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:self-start">
              {isOwnProfile ? (
                <Link href="/settings">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1.5" />
                    编辑资料
                  </Button>
                </Link>
              ) : (
                <FollowButton
                  username={user.username}
                  initialIsFollowing={isFollowing}
                />
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-stone-900/50 border border-stone-800/60 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-stone-400 mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-xs">案例</span>
            </div>
            <p className="text-2xl font-bold text-stone-100">
              {user.cases.length}
            </p>
          </div>
          <div className="bg-stone-900/50 border border-stone-800/60 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-stone-400 mb-1">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-xs">有用</span>
            </div>
            <p className="text-2xl font-bold text-stone-100">{totalUseful}</p>
          </div>
          <div className="bg-stone-900/50 border border-stone-800/60 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-stone-400 mb-1">
              <Heart className="h-4 w-4" />
              <span className="text-xs">共鸣</span>
            </div>
            <p className="text-2xl font-bold text-stone-100">{totalResonance}</p>
          </div>
        </div>

        {/* Published Cases */}
        <div>
          <h2 className="text-lg font-semibold text-stone-200 mb-4">
            发布的案例
          </h2>
          <Separator className="bg-stone-800 mb-6" />

          {user.cases.length === 0 ? (
            <EmptyState
              title="这位酒客还没开口"
              description="有些人习惯先听别人的故事，也许下次就轮到TA了"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.cases.map((c) => (
                <Link
                  key={c.id}
                  href={`/cases/${c.slug}`}
                  className="block group"
                >
                  <Card className="h-full border-stone-800/60 bg-stone-900/50 hover:bg-stone-900/80 hover:border-amber-900/30 transition-all duration-200 hover:shadow-lg hover:shadow-amber-950/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default" className="text-xs">
                          {c.category.name}
                        </Badge>
                        {c.tags.slice(0, 2).map((t) => (
                          <Badge
                            key={t.tagId}
                            variant="secondary"
                            className="text-xs"
                          >
                            {t.tag.name}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="text-lg font-semibold text-stone-100 group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                        {c.title}
                      </h3>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm text-stone-400 line-clamp-2 leading-relaxed">
                        {c.summary}
                      </p>
                    </CardContent>
                    <CardFooter className="flex items-center gap-4 text-stone-500 pt-0">
                      <span className="flex items-center gap-1 text-xs">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {c._count.usefulVotes}
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <Heart className="h-3.5 w-3.5" />
                        {c._count.resonanceVotes}
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {c._count.comments}
                      </span>
                      <span className="flex items-center gap-1 text-xs ml-auto">
                        <Bookmark className="h-3.5 w-3.5" />
                        {c._count.bookmarks}
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
