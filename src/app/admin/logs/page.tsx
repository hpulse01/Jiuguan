"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, ScrollText } from "lucide-react";

interface LogItem {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  createdAt: string;
  moderator: {
    username: string;
    profile?: { nickname?: string } | null;
  };
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/moderation-logs")
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : data.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-stone-500" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-100 mb-6">操作日志</h1>

      {logs.length === 0 ? (
        <div className="text-center py-20">
          <ScrollText className="h-12 w-12 text-stone-600 mx-auto mb-4" />
          <p className="text-stone-500">暂无操作日志</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-lg border border-stone-800/60 bg-stone-900/30 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-stone-100 font-medium">
                    {log.moderator.profile?.nickname || log.moderator.username}
                  </span>
                  <Badge variant="secondary" className="text-xs">{log.action}</Badge>
                  <Badge variant="outline" className="text-xs">{log.targetType}</Badge>
                </div>
                {log.reason && (
                  <p className="text-sm text-stone-400">原因: {log.reason}</p>
                )}
                <p className="text-xs text-stone-600 mt-1">
                  {new Date(log.createdAt).toLocaleString("zh-CN")} · 目标ID: {log.targetId.slice(0, 8)}...
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
