"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare } from "lucide-react";

interface CommentItem {
  id: string;
  content: string;
  commentType: string;
  createdAt: string;
  case: {
    slug: string;
    title: string;
  };
}

const typeLabels: Record<string, string> = {
  QUESTION: "提问",
  SUPPLEMENT: "补充",
  DISAGREEMENT: "不同看法",
  ALTERNATIVE: "替代方案",
};

export default function MyCommentsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/my/comments")
      .then((r) => r.json())
      .then((data) => setComments(Array.isArray(data) ? data : data.comments || []))
      .catch(() => setComments([]))
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-100">我的评论</h1>
          <p className="text-sm text-stone-500 mt-1">你发表过的所有评论</p>
        </div>

        {comments.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-12 w-12 text-stone-600" />}
            title="暂无评论"
            description="你还没有发表过评论"
          />
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-lg border border-stone-800/60 bg-stone-900/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Link
                    href={`/cases/${c.case.slug}`}
                    className="text-sm text-amber-500 hover:text-amber-400 transition-colors truncate"
                  >
                    {c.case.title}
                  </Link>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {typeLabels[c.commentType] || c.commentType}
                  </Badge>
                </div>
                <p className="text-sm text-stone-300 line-clamp-3">{c.content}</p>
                <p className="text-xs text-stone-600 mt-2">
                  {new Date(c.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
