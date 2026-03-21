"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Wine, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0f0d0a]">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("无效的验证链接");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.error);
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("验证失败，请重试");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0d0a] px-4">
      <div className="relative w-full max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <Wine className="h-8 w-8 text-amber-500" />
          <span className="text-2xl font-bold text-amber-500">酒馆</span>
        </Link>

        <div className="rounded-xl border border-stone-800 bg-stone-900/80 backdrop-blur-sm p-8 shadow-lg">
          {status === "loading" && (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 text-amber-500 animate-spin mx-auto" />
              <p className="text-stone-300">正在验证你的邮箱...</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h2 className="text-xl font-bold text-stone-50">{message}</h2>
              <p className="text-stone-400">现在你可以登录酒馆了</p>
              <Button asChild className="w-full" size="lg">
                <Link href="/login">进入酒馆</Link>
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-bold text-stone-50">验证失败</h2>
              <p className="text-stone-400">{message}</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">返回登录</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
