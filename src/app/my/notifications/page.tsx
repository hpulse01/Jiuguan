"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Bell, BellOff, CheckCheck, MessageSquare, ThumbsUp, Heart, Bookmark, UserPlus, Shield } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  COMMENT: <MessageSquare className="h-4 w-4 text-blue-400" />,
  REPLY: <MessageSquare className="h-4 w-4 text-blue-300" />,
  USEFUL_VOTE: <ThumbsUp className="h-4 w-4 text-amber-400" />,
  RESONANCE: <Heart className="h-4 w-4 text-pink-400" />,
  BOOKMARK: <Bookmark className="h-4 w-4 text-green-400" />,
  FOLLOW: <UserPlus className="h-4 w-4 text-purple-400" />,
  REVIEW_APPROVED: <Shield className="h-4 w-4 text-green-500" />,
  REVIEW_REJECTED: <Shield className="h-4 w-4 text-red-400" />,
  REPORT_HANDLED: <Bell className="h-4 w-4 text-amber-500" />,
  SYSTEM: <Bell className="h-4 w-4 text-stone-400" />,
};

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUnread, setShowUnread] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    const params = new URLSearchParams();
    if (showUnread) params.set("unreadOnly", "true");
    fetch(`/api/notifications?${params}`)
      .then((r) => r.json())
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [status, showUnread]);

  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast({ title: "已全部标记为已读" });
    } catch {
      toast({ title: "操作失败", variant: "destructive" });
    }
  }

  async function markRead(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-500" />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-stone-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-100">通知</h1>
            <p className="text-sm text-stone-500 mt-1">
              {unreadCount > 0 ? `${unreadCount} 条新消息` : "没有未读消息"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUnread(!showUnread)}
            >
              {showUnread ? <Bell className="h-4 w-4 mr-1" /> : <BellOff className="h-4 w-4 mr-1" />}
              {showUnread ? "全部" : "仅未读"}
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                全部已读
              </Button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="安静的夜晚"
            description={showUnread ? "没有未读消息，安心喝酒" : "还没有人找过你，但故事总会来的"}
          />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-lg border transition-colors ${
                  n.isRead
                    ? "border-stone-800/40 bg-stone-900/20"
                    : "border-amber-900/30 bg-amber-950/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {typeIcons[n.type] || typeIcons.SYSTEM}
                  </div>
                  <div className="flex-1 min-w-0">
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => !n.isRead && markRead(n.id)}
                        className="text-sm text-stone-200 hover:text-amber-400 transition-colors"
                      >
                        {n.message}
                      </Link>
                    ) : (
                      <p className="text-sm text-stone-200">{n.message}</p>
                    )}
                    <p className="text-xs text-stone-600 mt-1">
                      {new Date(n.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="h-2 w-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
