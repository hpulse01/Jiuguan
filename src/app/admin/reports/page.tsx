"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Eye, CheckCircle, XCircle } from "lucide-react";

interface Report {
  id: string;
  reason: string;
  detail: string | null;
  status: string;
  createdAt: string;
  reporter: { username: string; profile?: { nickname?: string } | null };
  case: { slug: string; title: string };
}

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待处理", color: "bg-amber-900/50 text-amber-400" },
  RESOLVED: { label: "已处理", color: "bg-green-900/50 text-green-400" },
  DISMISSED: { label: "已驳回", color: "bg-stone-700 text-stone-400" },
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    fetch(`/api/admin/reports?${params}`)
      .then((r) => r.json())
      .then((data) => setReports(Array.isArray(data) ? data : data.reports || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [filter]);

  async function handleReport(id: string, action: "resolve" | "dismiss") {
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      toast({ title: action === "resolve" ? "已处理" : "已驳回" });
      setReports((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: action === "resolve" ? "RESOLVED" : "DISMISSED" }
            : r
        )
      );
    } catch {
      toast({ title: "操作失败", variant: "destructive" });
    }
  }

  const filters = [
    { key: "", label: "全部" },
    { key: "PENDING", label: "待处理" },
    { key: "RESOLVED", label: "已处理" },
    { key: "DISMISSED", label: "已驳回" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-100 mb-6">举报管理</h1>

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
      ) : reports.length === 0 ? (
        <p className="text-stone-500 text-center py-20">暂无举报</p>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => {
            const st = statusMap[r.status] || statusMap.PENDING;
            return (
              <div
                key={r.id}
                className="p-4 rounded-lg border border-stone-800/60 bg-stone-900/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/cases/${r.case.slug}`}
                        className="text-stone-100 font-medium hover:text-amber-400 transition-colors truncate"
                      >
                        {r.case.title}
                      </Link>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-sm text-stone-300 mb-1">原因: {r.reason}</p>
                    {r.detail && <p className="text-sm text-stone-400">{r.detail}</p>}
                    <p className="text-xs text-stone-600 mt-1">
                      举报人: {r.reporter.profile?.nickname || r.reporter.username} · {new Date(r.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  {r.status === "PENDING" && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Link href={`/cases/${r.case.slug}`}>
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleReport(r.id, "resolve")}>
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleReport(r.id, "dismiss")}>
                        <XCircle className="h-4 w-4 text-stone-400" />
                      </Button>
                    </div>
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
