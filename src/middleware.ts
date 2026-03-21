export const runtime = "nodejs";

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedPaths = ["/my", "/cases/new", "/cases/edit", "/admin", "/publish"];
const adminPaths = ["/admin"];
const authPaths = ["/login", "/register"];

// ---- 全局 API 限速（内存实现） ----
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const apiRateLimitStore = new Map<string, RateLimitEntry>();

// 定期清理过期条目
if (typeof globalThis !== "undefined") {
  const g = globalThis as unknown as { __rateLimitCleanup?: boolean };
  if (!g.__rateLimitCleanup) {
    g.__rateLimitCleanup = true;
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of apiRateLimitStore) {
        if (now > entry.resetTime) apiRateLimitStore.delete(key);
      }
    }, 60_000);
  }
}

// API 路由限速配置
const API_RATE_LIMITS: Record<string, { limit: number; windowSeconds: number }> = {
  // 写操作：更严格
  "POST:/api/cases": { limit: 10, windowSeconds: 60 },
  "POST:/api/comments": { limit: 20, windowSeconds: 60 },
  "POST:/api/upload": { limit: 20, windowSeconds: 300 },
  // 读操作：宽松
  "GET:/api/search": { limit: 30, windowSeconds: 60 },
  "GET:/api/cases": { limit: 60, windowSeconds: 60 },
  // 默认
  "DEFAULT_GET": { limit: 60, windowSeconds: 60 },
  "DEFAULT_POST": { limit: 30, windowSeconds: 60 },
};

function getApiRateLimit(method: string, pathname: string) {
  // 先精确匹配
  const exactKey = `${method}:${pathname}`;
  if (API_RATE_LIMITS[exactKey]) return API_RATE_LIMITS[exactKey];

  // 前缀匹配
  for (const [key, config] of Object.entries(API_RATE_LIMITS)) {
    if (key.startsWith(`${method}:`) && pathname.startsWith(key.split(":").slice(1).join(":"))) {
      return config;
    }
  }

  // 默认限速
  return method === "GET" ? API_RATE_LIMITS["DEFAULT_GET"] : API_RATE_LIMITS["DEFAULT_POST"];
}

function checkApiRateLimit(ip: string, method: string, pathname: string): NextResponse | null {
  const config = getApiRateLimit(method, pathname);
  const key = `api:${ip}:${method}:${pathname.split("/").slice(0, 4).join("/")}`;
  const now = Date.now();
  const entry = apiRateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    apiRateLimitStore.set(key, { count: 1, resetTime: now + config.windowSeconds * 1000 });
    return null;
  }

  entry.count++;
  if (entry.count > config.limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return new NextResponse(
      JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // ---- 全局 API 限速 ----
  if (pathname.startsWith("/api/")) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimitResult = checkApiRateLimit(ip, req.method, pathname);
    if (rateLimitResult) return rateLimitResult;
  }

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && authPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Protect authenticated routes
  if (!isLoggedIn && protectedPaths.some((p) => pathname.startsWith(p))) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, req.url)
    );
  }

  // Protect admin routes - SUPER_ADMIN, ADMIN, MODERATOR can access
  if (
    adminPaths.some((p) => pathname.startsWith(p)) &&
    userRole !== "SUPER_ADMIN" &&
    userRole !== "ADMIN" &&
    userRole !== "MODERATOR"
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/my/:path*",
    "/cases/new",
    "/cases/edit/:path*",
    "/admin/:path*",
    "/publish",
    "/login",
    "/register",
    "/api/:path*",
  ],
};
