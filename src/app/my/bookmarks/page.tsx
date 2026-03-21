"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CaseCard } from "@/components/case-card";
import { EmptyState } from "@/components/empty-state";
import { Loader2, Bookmark } from "lucide-react";

interface BookmarkItem {
  id: string;
  case: {
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
  };
}

export default function MyBookmarksPage() {
  const { status } = useSession();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/my/bookmarks")
      .then((r) => r.json())
      .then((data) => setBookmarks(Array.isArray(data) ? data : data.bookmarks || []))
      .catch(() => setBookmarks([]))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-100">我的收藏</h1>
          <p className="text-sm text-stone-500 mt-1">你收藏的失败案例</p>
        </div>

        {bookmarks.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="酒杯还空着"
            description="遇到值得记住的教训，收藏起来，下次做决定前翻翻看"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bookmarks.map((b) => {
              const c = b.case;
              return (
                <CaseCard
                  key={b.id}
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
                    c.isAnonymous ? undefined : c.author.profile?.avatar ?? undefined
                  }
                  isAnonymous={c.isAnonymous}
                  createdAt={new Date(c.publishedAt || c.createdAt)}
                  usefulCount={c._count.usefulVotes}
                  resonanceCount={c._count.resonanceVotes}
                  commentCount={c._count.comments}
                  bookmarkCount={c._count.bookmarks}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
