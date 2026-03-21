"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, LayoutDashboard, FileText, Users, Flag, FolderOpen, Tag, ScrollText, ShieldCheck } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRole?: "SUPER_ADMIN" | "ADMIN";
}

const adminNav: NavItem[] = [
  { href: "/admin", label: "仪表盘", icon: LayoutDashboard },
  { href: "/admin/cases", label: "案例管理", icon: FileText },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/reports", label: "举报管理", icon: Flag },
  { href: "/admin/categories", label: "分类管理", icon: FolderOpen },
  { href: "/admin/tags", label: "标签管理", icon: Tag },
  { href: "/admin/logs", label: "操作日志", icon: ScrollText },
  { href: "/admin/permissions", label: "权限管理", icon: ShieldCheck, requiredRole: "SUPER_ADMIN" },
];

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "超级管理员",
  ADMIN: "管理员",
  MODERATOR: "版主",
};

function isRoleAtLeast(userRole: string, minRole: string): boolean {
  const order = ["GUEST", "USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"];
  return order.indexOf(userRole) >= order.indexOf(minRole);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-500" />
      </div>
    );
  }

  const userRole = session?.user?.role;
  if (!session?.user || !userRole || !isRoleAtLeast(userRole, "MODERATOR")) {
    router.push("/");
    return null;
  }

  const visibleNav = adminNav.filter((item) => {
    if (!item.requiredRole) return true;
    return isRoleAtLeast(userRole, item.requiredRole);
  });

  return (
    <div className="min-h-screen bg-stone-950">
      <div className="flex">
        <aside className="w-56 min-h-screen border-r border-stone-800/60 bg-stone-900/30 p-4 shrink-0">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-stone-100">管理后台</h2>
            <p className="text-xs text-stone-500">{roleLabels[userRole] || userRole}</p>
          </div>
          <nav className="space-y-1">
            {visibleNav.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-amber-600/20 text-amber-400"
                      : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
