"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wine, Loader2, Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    getValues,
  } = useForm<{ email: string }>();

  const onSubmit = async (data: { email: string }) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error);
        return;
      }
      setSent(true);
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
          <h1 className="text-2xl font-bold text-stone-50 mb-2">忘记密码</h1>
          <p className="text-stone-400">输入你的邮箱，我们将发送重置链接</p>
        </div>

        <div className="rounded-xl border border-stone-800 bg-stone-900/80 backdrop-blur-sm p-8 shadow-lg">
          {sent ? (
            <div className="text-center space-y-4">
              <Mail className="h-12 w-12 text-amber-500 mx-auto" />
              <h2 className="text-lg font-bold text-stone-50">邮件已发送</h2>
              <p className="text-stone-400 text-sm">
                如果 <span className="text-amber-400">{getValues("email")}</span> 已注册，你将收到密码重置邮件
              </p>
              <p className="text-stone-500 text-xs">重置链接1小时内有效</p>
              <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回登录
                </Link>
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
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...register("email", { required: true })}
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    发送中...
                  </>
                ) : (
                  "发送重置链接"
                )}
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-sm text-amber-500 hover:text-amber-400 transition-colors">
                  <ArrowLeft className="inline mr-1 h-3 w-3" />
                  返回登录
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
