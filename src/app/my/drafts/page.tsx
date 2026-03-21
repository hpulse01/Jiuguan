"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Edit, Send, Trash2, FileEdit } from "lucide-react";

interface DraftItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export default function MyDraftsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/my/drafts")
      .then((r) => r.json())
      .then((data) => setDrafts(Array.isArray(data) ? data : data.drafts || []))
      .catch(() => setDrafts([]))
      .finally(() => setLoading(false));
  }, [status]);

  async function submitDraft(slug: string) {
    try {
      const res = await fetch(`/api/cases/${slug}/submit`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast({ title: "提交成功", description: "案例已提交审核" });
      setDrafts((prev) => prev.filter((d) => d.slug !== slug));
    } catch {
      toast({ title: "提交失败", variant: "destructive" });
    }
  }

  async function deleteDraft(slug: string) {
    if (!confirm("确定要删除这个草稿吗？")) return;
    try {
      const res = await fetch(`/api/cases/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "已删除" });
      setDrafts((prev) => prev.filter((d) => d.slug !== slug));
    } catch {
      toast({ title: "删除失败", variant: "destructive" });
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-100">我的草稿</h1>
            <p className="text-sm text-stone-500 mt-1">继续编辑你的草稿案例</p>
          </div>
          <Link href="/publish">
            <Button>新建案例</Button>
          </Link>
        </div>

        {drafts.length === 0 ? (
          <EmptyState
            icon={<FileEdit className="h-12 w-12 text-stone-600" />}
            title="暂无草稿"
            description="你还没有保存任何草稿"
          />
        ) : (
          <div className="space-y-3">
            {drafts.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-lg border border-stone-800/60 bg-stone-900/30 hover:bg-stone-900/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-stone-100 font-medium truncate">
                      {d.title || "无标题"}
                    </h3>
                    {d.summary && (
                      <p className="text-sm text-stone-400 line-clamp-1 mt-1">{d.summary}</p>
                    )}
                    <p className="text-xs text-stone-600 mt-1">
                      最后编辑 {new Date(d.updatedAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/cases/${d.slug}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => submitDraft(d.slug)}>
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDraft(d.slug)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
