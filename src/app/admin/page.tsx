"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, FileText, MessageSquare, Bookmark, Flag, TrendingUp } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalCases: number;
  drafts: number;
  pending: number;
  published: number;
  totalComments: number;
  totalBookmarks: number;
  pendingReports: number;
  topCategories: { name: string; _count: { cases: number } }[];
  topTags: { name: string; _count: { cases: number } }[];
  trend: { date: string; count: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-stone-500" />
      </div>
    );
  }

  if (!stats) return <p className="text-stone-500">加载失败</p>;

  const statCards = [
    { label: "用户总数", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
    { label: "案例总数", value: stats.totalCases, icon: FileText, color: "text-amber-400" },
    { label: "已发布", value: stats.published, icon: TrendingUp, color: "text-green-400" },
    { label: "待审核", value: stats.pending, icon: FileText, color: "text-orange-400" },
    { label: "评论总数", value: stats.totalComments, icon: MessageSquare, color: "text-purple-400" },
    { label: "收藏总数", value: stats.totalBookmarks, icon: Bookmark, color: "text-pink-400" },
    { label: "待处理举报", value: stats.pendingReports, icon: Flag, color: "text-red-400" },
    { label: "草稿", value: stats.drafts, icon: FileText, color: "text-stone-400" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-100 mb-6">仪表盘</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <Card key={s.label} className="border-stone-800/60 bg-stone-900/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500">{s.label}</p>
                  <p className="text-2xl font-bold text-stone-100 mt-1">{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top categories */}
        <Card className="border-stone-800/60 bg-stone-900/30">
          <CardHeader>
            <CardTitle className="text-stone-100 text-base">热门分类</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topCategories?.length > 0 ? (
              <div className="space-y-2">
                {stats.topCategories.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-stone-300">{cat.name}</span>
                    <span className="text-sm text-stone-500">{cat._count.cases} 案例</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-500">暂无数据</p>
            )}
          </CardContent>
        </Card>

        {/* Top tags */}
        <Card className="border-stone-800/60 bg-stone-900/30">
          <CardHeader>
            <CardTitle className="text-stone-100 text-base">热门标签</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topTags?.length > 0 ? (
              <div className="space-y-2">
                {stats.topTags.map((tag, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-stone-300">{tag.name}</span>
                    <span className="text-sm text-stone-500">{tag._count.cases} 案例</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-500">暂无数据</p>
            )}
          </CardContent>
        </Card>

        {/* Recent trend */}
        <Card className="border-stone-800/60 bg-stone-900/30 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-stone-100 text-base">近7天案例趋势</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.trend?.length > 0 ? (
              <div className="flex items-end gap-2 h-32">
                {stats.trend.map((d, i) => {
                  const max = Math.max(...stats.trend.map((t) => t.count), 1);
                  const height = (d.count / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-stone-500">{d.count}</span>
                      <div
                        className="w-full bg-amber-600/50 rounded-t"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                      <span className="text-xs text-stone-600">
                        {new Date(d.date).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-stone-500">暂无数据</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
