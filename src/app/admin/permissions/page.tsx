"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ShieldAlert, ShieldCheck, Shield, Users, AlertTriangle } from "lucide-react";

interface PrivilegedUser {
  id: string;
  email: string;
  username: string;
  role: string;
  roleLabel: string;
  isBanned: boolean;
  createdAt: string;
  profile?: { nickname?: string; avatar?: string } | null;
  _count?: { moderationLogs: number };
}

interface RoleHierarchyItem {
  role: string;
  label: string;
  description: string;
}

interface RoleDistItem {
  role: string;
  label: string;
  count: number;
}

interface SensitiveAction {
  id: string;
  action: string;
  detail?: string;
  targetId: string;
  targetType: string;
  createdAt: string;
  moderator: {
    id: string;
    username: string;
    email: string;
    role: string;
    profile?: { nickname?: string } | null;
  };
}

interface PermissionsData {
  superAdmin: { id: string; email: string; username: string; role: string; createdAt: string; profile?: { nickname?: string } | null } | null;
  superAdminEmail: string;
  privilegedUsers: PrivilegedUser[];
  roleDistribution: RoleDistItem[];
  sensitiveActions: SensitiveAction[];
  roleHierarchy: RoleHierarchyItem[];
}

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  SUPER_ADMIN: ShieldAlert,
  ADMIN: ShieldCheck,
  MODERATOR: Shield,
};

const actionLabels: Record<string, string> = {
  ROLE_CHANGED: "角色变更",
  USER_BANNED: "用户封禁",
  USER_UNBANNED: "用户解封",
  ILLEGAL_ROLE_CHANGE_ATTEMPT: "非法角色变更尝试",
  ILLEGAL_BAN_ATTEMPT: "非法封禁尝试",
  ILLEGAL_DELETE_ATTEMPT: "非法删除尝试",
};

export default function AdminPermissionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<PermissionsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== "SUPER_ADMIN") {
      router.push("/admin");
      return;
    }

    fetch("/api/admin/permissions")
      .then((r) => {
        if (!r.ok) throw new Error("权限不足");
        return r.json();
      })
      .then(setData)
      .catch(() => router.push("/admin"))
      .finally(() => setLoading(false));
  }, [session, router]);

  if (loading || !data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-stone-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-100 mb-2">系统权限管理</h1>
        <p className="text-sm text-stone-500">此页面仅超级管理员可见，用于管理系统权限体系与监控敏感操作。</p>
      </div>

      {/* 超级管理员信息 */}
      <section className="p-5 rounded-lg border border-red-800/40 bg-red-950/10">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="h-5 w-5 text-red-400" />
          <h2 className="text-lg font-semibold text-stone-100">唯一超级管理员</h2>
        </div>
        {data.superAdmin ? (
          <div className="flex items-center gap-3">
            <div>
              <p className="text-stone-200 font-medium">
                {data.superAdmin.profile?.nickname || data.superAdmin.username}
              </p>
              <p className="text-xs text-stone-500">
                {data.superAdmin.email} · @{data.superAdmin.username} · 注册于 {new Date(data.superAdmin.createdAt).toLocaleDateString("zh-CN")}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-red-400 text-sm">超级管理员账号未找到，请运行 seed 初始化。</p>
        )}
        <p className="text-xs text-stone-600 mt-3">
          固定邮箱：{data.superAdminEmail} | 系统保证此账号不可被降级、删除或封禁。
        </p>
      </section>

      {/* 角色体系说明 */}
      <section>
        <h2 className="text-lg font-semibold text-stone-100 mb-3">角色体系</h2>
        <div className="space-y-2">
          {data.roleHierarchy.map((item) => {
            const Icon = roleIcons[item.role] || Users;
            const dist = data.roleDistribution.find((r) => r.role === item.role);
            return (
              <div
                key={item.role}
                className="p-3 rounded-lg border border-stone-800/60 bg-stone-900/30 flex items-center gap-3"
              >
                <Icon className="h-5 w-5 text-stone-400 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-200 font-medium">{item.label}</span>
                    <Badge variant="secondary" className="text-xs">{dist?.count || 0} 人</Badge>
                  </div>
                  <p className="text-xs text-stone-500">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 高权限用户列表 */}
      <section>
        <h2 className="text-lg font-semibold text-stone-100 mb-3">高权限账号</h2>
        <div className="space-y-2">
          {data.privilegedUsers.map((u) => {
            const Icon = roleIcons[u.role] || Users;
            return (
              <div
                key={u.id}
                className={`p-3 rounded-lg border bg-stone-900/30 flex items-center gap-3 ${
                  u.role === "SUPER_ADMIN" ? "border-red-800/40" : "border-stone-800/60"
                }`}
              >
                <Avatar className="h-8 w-8">
                  {u.profile?.avatar && <AvatarImage src={u.profile.avatar} />}
                  <AvatarFallback className="bg-stone-800 text-stone-300 text-xs">
                    {(u.profile?.nickname || u.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-200 text-sm font-medium">
                      {u.profile?.nickname || u.username}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      <Icon className="h-3 w-3 mr-1" />
                      {u.roleLabel}
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-500">
                    {u.email} · {u._count?.moderationLogs || 0} 次管理操作
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 敏感操作日志 */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-stone-100">敏感操作日志</h2>
        </div>
        {data.sensitiveActions.length === 0 ? (
          <p className="text-sm text-stone-500">暂无敏感操作记录。</p>
        ) : (
          <div className="space-y-1">
            {data.sensitiveActions.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-lg border bg-stone-900/30 ${
                  log.action.startsWith("ILLEGAL_")
                    ? "border-red-800/40"
                    : "border-stone-800/60"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={log.action.startsWith("ILLEGAL_") ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {actionLabels[log.action] || log.action}
                  </Badge>
                  <span className="text-xs text-stone-500">
                    {log.moderator.profile?.nickname || log.moderator.username} ({log.moderator.email})
                  </span>
                  <span className="text-xs text-stone-600 ml-auto">
                    {new Date(log.createdAt).toLocaleString("zh-CN")}
                  </span>
                </div>
                {log.detail && (
                  <p className="text-xs text-stone-400">{log.detail}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
