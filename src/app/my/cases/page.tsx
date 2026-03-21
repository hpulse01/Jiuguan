"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Loader2, Edit, Eye, Send, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface CaseItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  status: string;
  createdAt: string;
  publishedAt: string | null;
  _count?: {
    usefulVotes: number;
    resonanceVotes: number;
    comments: number;
  };
}

const statusMap: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "草稿", color: "bg-stone-700 text-stone-300" },
  PENDING: { label: "审核中", color: "bg-amber-900/50 text-amber-400" },
  PUBLISHED: { label: "已发布", color: "bg-green-900/50 text-green-400" },
  REJECTED: { label: "已拒绝", color: "bg-red-900/50 text-red-400" },
  ARCHIVED: { label: "已归档", color: "bg-stone-800 text-stone-500" },
};

export default function MyCasesPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    fetch(`/api/my/cases?${params}`)
      .then((r) => r.json())
      .then((data) => setCases(Array.isArray(data) ? data : data.cases || []))
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, [authStatus, filter]);

  async function submitCase(slug: string) {
    try {
      const res = await fetch(`/api/cases/${slug}/submit`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast({ title: "提交成功", description: "案例已提交审核" });
      setCases((prev) =>
        prev.map((c) => (c.slug === slug ? { ...c, status: "PENDING" } : c))
      );
    } catch {
      toast({ title: "提交失败", variant: "destructive" });
    }
  }

  async function deleteCase(slug: string) {
    if (!confirm("确定要删除这个案例吗？此操作不可撤销。")) return;
    try {
      const res = await fetch(`/api/cases/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "已删除" });
      setCases((prev) => prev.filter((c) => c.slug !== slug));
    } catch {
      toast({ title: "删除失败", variant: "destructive" });
    }
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-500" />
      </div>
    );
  }

  const statusFilters = [
    { key: "", label: "全部" },
    { key: "DRAFT", label: "草稿" },
    { key: "PENDING", label: "审核中" },
    { key: "PUBLISHED", label: "已发布" },
    { key: "REJECTED", label: "已拒绝" },
  ];

  return (
    <div className="min-h-screen bg-stone-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-100">我的案例</h1>
            <p className="text-sm text-stone-500 mt-1">管理你发布和草稿的案例</p>
          </div>
          <Link href="/publish">
            <Button>分享案例</Button>
          </Link>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 mb-6 bg-stone-900/50 rounded-lg p-1 w-fit border border-stone-800/40">
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === f.key
                  ? "bg-stone-800 text-stone-50 shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {cases.length === 0 ? (
          <EmptyState title="你的故事还没开讲" description="每段弯路都值得被记录，坐下来说说你踩过的坑" />
        ) : (
          <div className="space-y-3">
            {cases.map((c) => {
              const st = statusMap[c.status] || statusMap.DRAFT;
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-lg border border-stone-800/60 bg-stone-900/30 hover:bg-stone-900/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/cases/${c.slug}`}
                          className="text-stone-100 font-medium hover:text-amber-400 transition-colors truncate"
                        >
                          {c.title}
                        </Link>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-sm text-stone-400 line-clamp-1">{c.summary}</p>
                      <p className="text-xs text-stone-600 mt-1">
                        创建于 {new Date(c.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {c.status === "PUBLISHED" && (
                        <Link href={`/cases/${c.slug}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      {(c.status === "DRAFT" || c.status === "REJECTED") && (
                        <>
                          <Link href={`/cases/${c.slug}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => submitCase(c.slug)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {c.status !== "PUBLISHED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCase(c.slug)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
