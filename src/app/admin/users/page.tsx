"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Shield, ShieldCheck, User } from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
  profile?: { nickname?: string; avatar?: string } | null;
  _count?: { cases: number };
}

const roleLabels: Record<string, string> = {
  USER: "用户",
  MODERATOR: "版主",
  ADMIN: "管理员",
};

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : data.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  async function updateRole(userId: string, role: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "操作失败");
      }
      toast({ title: "角色已更新" });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    } catch (err) {
      toast({
        title: "操作失败",
        description: err instanceof Error ? err.message : "请稍后重试",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-stone-500" />
      </div>
    );
  }

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-100 mb-6">用户管理</h1>

      <div className="space-y-2">
        {users.map((u) => (
          <div
            key={u.id}
            className="p-4 rounded-lg border border-stone-800/60 bg-stone-900/30 flex items-center gap-4"
          >
            <Avatar className="h-10 w-10">
              {u.profile?.avatar && <AvatarImage src={u.profile.avatar} />}
              <AvatarFallback className="bg-stone-800 text-stone-300">
                {(u.profile?.nickname || u.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-stone-100 font-medium">
                  {u.profile?.nickname || u.username}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {roleLabels[u.role] || u.role}
                </Badge>
              </div>
              <p className="text-xs text-stone-500">
                @{u.username} · {u.email} · {u._count?.cases || 0} 案例 · 注册于 {new Date(u.createdAt).toLocaleDateString("zh-CN")}
              </p>
            </div>
            {isAdmin && u.id !== session?.user?.id && (
              <div className="flex items-center gap-1 shrink-0">
                {u.role !== "MODERATOR" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateRole(u.id, "MODERATOR")}
                    title="设为版主"
                  >
                    <Shield className="h-4 w-4 text-amber-500" />
                  </Button>
                )}
                {u.role === "MODERATOR" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateRole(u.id, "USER")}
                    title="取消版主"
                  >
                    <User className="h-4 w-4 text-stone-400" />
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
