"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wine, Loader2, CheckCircle, XCircle } from "lucide-react";

interface ResetForm {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0f0d0a]">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"form" | "success" | "error">("form");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>();

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0d0a] px-4">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-stone-50 mb-2">无效的重置链接</h2>
          <Button asChild variant="outline">
            <Link href="/forgot-password">重新申请</Link>
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ResetForm) => {
    setError(null);

    if (data.password !== data.confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    if (data.password.length < 6) {
      setError("密码至少6个字符");
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error);
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setError("网络错误，请稍后重试");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0d0a] px-4">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Wine className="h-8 w-8 text-amber-500" />
            <span className="text-2xl font-bold text-amber-500">酒馆</span>
          </Link>
          <h1 className="text-2xl font-bold text-stone-50 mb-2">设置新密码</h1>
        </div>

        <div className="rounded-xl border border-stone-800 bg-stone-900/80 backdrop-blur-sm p-8 shadow-lg">
          {status === "success" ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h2 className="text-lg font-bold text-stone-50">密码重置成功！</h2>
              <p className="text-stone-400 text-sm">你可以使用新密码登录了</p>
              <Button asChild className="w-full">
                <Link href="/login">去登录</Link>
              </Button>
            </div>
          ) : status === "error" && error ? (
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-lg font-bold text-stone-50">重置失败</h2>
              <p className="text-stone-400 text-sm">{error}</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/forgot-password">重新申请</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="rounded-lg border border-red-900/50 bg-red-950/50 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">新密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="至少6个字符"
                  {...register("password", { required: true, minLength: 6 })}
                />
                {errors.password && (
                  <p className="text-sm text-red-400">密码至少6个字符</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认新密码</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="再输入一次"
                  {...register("confirmPassword", { required: true })}
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    重置中...
                  </>
                ) : (
                  "重置密码"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
