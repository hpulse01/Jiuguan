"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, ShieldAlert, Shield, ShieldCheck, User, Ban, CheckCircle } from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  username: string;
  role: string;
  isBanned?: boolean;
  bannedAt?: string;
  bannedReason?: string;
  createdAt: string;
  profile?: { nickname?: string; avatar?: string } | null;
  _count?: { cases: number; comments: number; reports: number };
}

const roleLabels: Record<string, string> = {
  GUEST: "游客",
  USER: "用户",
  MODERATOR: "版主",
  ADMIN: "管理员",
  SUPER_ADMIN: "超级管理员",
};

const roleBadgeColors: Record<string, string> = {
  SUPER_ADMIN: "bg-red-600/20 text-red-400 border-red-600/30",
  ADMIN: "bg-amber-600/20 text-amber-400 border-amber-600/30",
  MODERATOR: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  USER: "bg-stone-600/20 text-stone-400 border-stone-600/30",
  GUEST: "bg-stone-700/20 text-stone-500 border-stone-700/30",
};

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const isAdminOrAbove = session?.user?.role === "ADMIN" || isSuperAdmin;

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (search) params.set("search", search);
    if (roleFilter && roleFilter !== "all") params.set("role", roleFilter);

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
      // assignableRoles available from API for future use
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function updateRole(userId: string, role: string) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失败");
      toast({ title: "角色已更新" });
      fetchUsers(pagination.page);
    } catch (err) {
      toast({
        title: "操作失败",
        description: err instanceof Error ? err.message : "请稍后重试",
        variant: "destructive",
      });
    }
  }

  async function toggleBan(userId: string, currentlyBanned: boolean) {
    const action = currentlyBanned ? "unban" : "ban";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action,
          reason: action === "ban" ? "违反社区规定" : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失败");
      toast({ title: currentlyBanned ? "用户已解封" : "用户已封禁" });
      fetchUsers(pagination.page);
    } catch (err) {
      toast({
        title: "操作失败",
        description: err instanceof Error ? err.message : "请稍后重试",
        variant: "destructive",
      });
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-100 mb-6">用户管理</h1>

      {/* 搜索和筛选 */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
          <Input
            placeholder="搜索用户名、邮箱或昵称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            className="pl-10 bg-stone-900/50 border-stone-800 text-stone-200"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); }}>
          <SelectTrigger className="w-40 bg-stone-900/50 border-stone-800 text-stone-200">
            <SelectValue placeholder="筛选角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部角色</SelectItem>
            <SelectItem value="SUPER_ADMIN">超级管理员</SelectItem>
            <SelectItem value="ADMIN">管理员</SelectItem>
            <SelectItem value="MODERATOR">版主</SelectItem>
            <SelectItem value="USER">用户</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => fetchUsers()} className="border-stone-700">
          搜索
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-stone-500" />
        </div>
      ) : (
        <>
          <div className="text-sm text-stone-500 mb-4">共 {pagination.total} 个用户</div>
          <div className="space-y-2">
            {users.map((u) => {
              const isSA = u.role === "SUPER_ADMIN";
              const canOperate = isAdminOrAbove && u.id !== session?.user?.id && !isSA;
              const canChangeToAdmin = isSuperAdmin && u.id !== session?.user?.id && !isSA;

              return (
                <div
                  key={u.id}
                  className={`p-4 rounded-lg border bg-stone-900/30 flex items-center gap-4 ${
                    isSA ? "border-red-800/40" : u.isBanned ? "border-red-900/40 opacity-70" : "border-stone-800/60"
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    {u.profile?.avatar && <AvatarImage src={u.profile.avatar} />}
                    <AvatarFallback className="bg-stone-800 text-stone-300">
                      {(u.profile?.nickname || u.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-stone-100 font-medium">
                        {u.profile?.nickname || u.username}
                      </span>
                      <Badge variant="outline" className={roleBadgeColors[u.role] || ""}>
                        {isSA && <ShieldAlert className="h-3 w-3 mr-1" />}
                        {roleLabels[u.role] || u.role}
                      </Badge>
                      {u.isBanned && (
                        <Badge variant="destructive" className="text-xs">
                          已封禁
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      @{u.username} · {u.email} · {u._count?.cases || 0} 案例 · {u._count?.comments || 0} 评论 · {u._count?.reports || 0} 举报 · 注册于 {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                    </p>
                    {u.isBanned && u.bannedReason && (
                      <p className="text-xs text-red-400 mt-0.5">封禁原因：{u.bannedReason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {/* 角色管理按钮 */}
                    {canOperate && (
                      <>
                        {u.role !== "MODERATOR" && u.role !== "ADMIN" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateRole(u.id, "MODERATOR")}
                            title="设为版主"
                          >
                            <Shield className="h-4 w-4 text-blue-400" />
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
                        {canChangeToAdmin && u.role !== "ADMIN" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateRole(u.id, "ADMIN")}
                            title="设为管理员"
                          >
                            <ShieldCheck className="h-4 w-4 text-amber-400" />
                          </Button>
                        )}
                        {canChangeToAdmin && u.role === "ADMIN" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateRole(u.id, "MODERATOR")}
                            title="降级为版主"
                          >
                            <Shield className="h-4 w-4 text-blue-400" />
                          </Button>
                        )}
                      </>
                    )}
                    {/* 封禁/解封按钮 */}
                    {canOperate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleBan(u.id, !!u.isBanned)}
                        title={u.isBanned ? "解封" : "封禁"}
                      >
                        {u.isBanned ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <Ban className="h-4 w-4 text-red-400" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchUsers(pagination.page - 1)}
                className="border-stone-700"
              >
                上一页
              </Button>
              <span className="text-sm text-stone-400 py-1.5">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchUsers(pagination.page + 1)}
                className="border-stone-700"
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
