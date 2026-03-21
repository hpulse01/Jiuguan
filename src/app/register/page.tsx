"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wine, Loader2, Mail } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "注册失败，请重试");
        return;
      }

      // 需要邮箱验证
      if (json.requiresVerification) {
        setRegisteredEmail(data.email);
        setVerificationSent(true);
        return;
      }

      // 无需验证，直接登录
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("注册成功，但自动登录失败，请手动登录");
        router.push("/login");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试");
    }
  };

  const handleResendVerification = async () => {
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
    } catch {
      // 静默失败
    }
  };

  // 验证邮件已发送状态
  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0d0a] px-4 py-12">
        <div className="relative w-full max-w-md text-center">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <Wine className="h-8 w-8 text-amber-500" />
              <span className="text-2xl font-bold text-amber-500">酒馆</span>
            </Link>
          </div>
          <div className="rounded-xl border border-stone-800 bg-stone-900/80 backdrop-blur-sm p-8 shadow-lg">
            <Mail className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-stone-50 mb-2">查收验证邮件</h2>
            <p className="text-stone-400 mb-2">
              我们已向 <span className="text-amber-400">{registeredEmail}</span> 发送了验证邮件
            </p>
            <p className="text-stone-500 text-sm mb-6">
              请点击邮件中的链接完成验证，然后即可登录酒馆
            </p>
            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">去登录</Link>
              </Button>
              <button
                onClick={handleResendVerification}
                className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
              >
                没收到？重新发送
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0d0a] px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-amber-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-amber-800/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Wine className="h-8 w-8 text-amber-500" />
            <span className="text-2xl font-bold text-amber-500">酒馆</span>
          </Link>
          <h1 className="text-3xl font-bold text-stone-50 mb-2">
            加入酒馆
          </h1>
          <p className="text-stone-400">
            每一次失败都值得被记住
          </p>
        </div>

        <div className="rounded-xl border border-stone-800 bg-stone-900/80 backdrop-blur-sm p-8 shadow-lg">
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
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="给自己取个名字"
                {...register("username")}
              />
              {errors.username && (
                <p className="text-sm text-red-400">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少6个字符"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再输入一次密码"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  注册中...
                </>
              ) : (
                "加入酒馆"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-stone-400">
            已有账号？{" "}
            <Link
              href="/login"
              className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
            >
              回到酒馆
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-stone-600">
          注册即表示你同意在酒馆坦诚分享、互相尊重
        </p>
      </div>
    </div>
  );
}
