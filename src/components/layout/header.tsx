"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Beer,
  Search,
  Bell,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  Settings,
  Compass,
  LayoutGrid,
  Home,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/", label: "首页", icon: Home },
  { href: "/discover", label: "发现", icon: Compass },
  { href: "/categories", label: "分类", icon: LayoutGrid },
];

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = session?.user;
  const isLoading = status === "loading";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-tavern">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <Beer className="h-6 w-6 text-warm-500" strokeWidth={1.8} />
          <span className="text-xl font-bold tracking-tight text-tavern-100">
            酒馆
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/search"
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          >
            <Search className="h-4 w-4" />
            搜索
          </Link>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Search button (mobile) */}
          <Link
            href="/search"
            className="rounded-md p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)] md:hidden"
          >
            <Search className="h-5 w-5" />
          </Link>

          {/* Notifications */}
          {user && (
            <Link
              href="/notifications"
              className="relative rounded-md p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-warm-500" />
            </Link>
          )}

          {/* User Menu / Auth */}
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--muted)]" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-md p-1 transition-colors hover:bg-[var(--accent)]">
                  <Avatar className="h-8 w-8 border border-[var(--border)]">
                    <AvatarImage
                      src={user.avatar ?? undefined}
                      alt={user.nickname ?? user.username ?? "用户头像"}
                    />
                    <AvatarFallback className="bg-tavern-800 text-xs text-tavern-200">
                      {(user.nickname || user.username)?.charAt(0)?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-[var(--muted-foreground)] sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)]"
              >
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user.nickname || user.username}</p>
                  <p className="truncate text-xs text-[var(--muted-foreground)]">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-[var(--border)]" />
                <DropdownMenuItem asChild>
                  <Link href={`/user/${user.username}`} className="flex cursor-pointer items-center gap-2">
                    <User className="h-4 w-4" />
                    我的主页
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex cursor-pointer items-center gap-2">
                    <Settings className="h-4 w-4" />
                    设置
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[var(--border)]" />
                <DropdownMenuItem
                  className="flex cursor-pointer items-center gap-2 text-red-400 focus:text-red-400"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                >
                  登录
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="bg-warm-600 text-white hover:bg-warm-700"
                >
                  注册
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="rounded-md p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)] md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "关闭菜单" : "打开菜单"}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="animate-slideUp border-t border-[var(--border)] bg-[var(--background)] md:hidden">
          <nav className="mx-auto max-w-7xl space-y-1 px-4 pb-4 pt-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}

            {!user && (
              <div className="flex gap-2 border-t border-[var(--border)] pt-3">
                <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    登录
                  </Button>
                </Link>
                <Link href="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-warm-600 text-white hover:bg-warm-700">
                    注册
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
