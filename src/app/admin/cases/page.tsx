"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Eye, CheckCircle, XCircle, Star, StarOff } from "lucide-react";

interface AdminCase {
  id: string;
  slug: string;
  title: string;
  status: string;
  isFeatured: boolean;
  createdAt: string;
  author: { username: string; profile?: { nickname?: string } | null };
  category: { name: string };
  _count?: { reports: number };
}

const statusMap: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "草稿", color: "bg-stone-700 text-stone-300" },
  PENDING: { label: "待审核", color: "bg-amber-900/50 text-amber-400" },
  PUBLISHED: { label: "已发布", color: "bg-green-900/50 text-green-400" },
  REJECTED: { label: "已拒绝", color: "bg-red-900/50 text-red-400" },
  ARCHIVED: { label: "已归档", color: "bg-stone-800 text-stone-500" },
};

export default function AdminCasesPage() {
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    fetch(`/api/admin/cases?${params}`)
      .then((r) => r.json())
      .then((data) => setCases(Array.isArray(data) ? data : data.cases || []))
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, [filter]);

  async function reviewCase(id: string, action: "approve" | "reject") {
    try {
      const res = await fetch(`/api/admin/cases/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      toast({ title: action === "approve" ? "已通过" : "已拒绝" });
      setCases((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, status: action === "approve" ? "PUBLISHED" : "REJECTED" }
            : c
        )
      );
    } catch {
      toast({ title: "操作失败", variant: "destructive" });
    }
  }

  async function toggleFeatured(id: string) {
    try {
      const res = await fetch(`/api/admin/cases/${id}/feature`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast({ title: data.isFeatured ? "已加精" : "已取消精选" });
      setCases((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isFeatured: data.isFeatured } : c))
      );
    } catch {
      toast({ title: "操作失败", variant: "destructive" });
    }
  }

  const filters = [
    { key: "", label: "全部" },
    { key: "PENDING", label: "待审核" },
    { key: "PUBLISHED", label: "已发布" },
    { key: "REJECTED", label: "已拒绝" },
    { key: "DRAFT", label: "草稿" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-100 mb-6">案例管理</h1>

      <div className="flex items-center gap-1 mb-6 bg-stone-900/50 rounded-lg p-1 w-fit border border-stone-800/40">
        {filters.map((f) => (
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

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-stone-500" />
        </div>
      ) : cases.length === 0 ? (
        <p className="text-stone-500 text-center py-20">暂无案例</p>
      ) : (
        <div className="space-y-2">
          {cases.map((c) => {
            const st = statusMap[c.status] || statusMap.DRAFT;
            return (
              <div
                key={c.id}
                className="p-4 rounded-lg border border-stone-800/60 bg-stone-900/30 flex items-center gap-4"
              >
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
                    {c.isFeatured && (
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-stone-500">
                    {c.author.profile?.nickname || c.author.username} · {c.category.name} · {new Date(c.createdAt).toLocaleDateString("zh-CN")}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/cases/${c.slug}`}>
                    <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                  </Link>
                  {c.status === "PENDING" && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => reviewCase(c.id, "approve")}>
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => reviewCase(c.id, "reject")}>
                        <XCircle className="h-4 w-4 text-red-400" />
                      </Button>
                    </>
                  )}
                  {c.status === "PUBLISHED" && (
                    <Button variant="ghost" size="sm" onClick={() => toggleFeatured(c.id)}>
                      {c.isFeatured ? (
                        <StarOff className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Star className="h-4 w-4 text-stone-500" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
