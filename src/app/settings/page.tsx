"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save } from "lucide-react";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nickname: "",
      bio: "",
      avatar: "",
      location: "",
      website: "",
    },
  });

  const avatarUrl = watch("avatar");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetch("/api/profile")
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch profile");
        })
        .then((data) => {
          reset({
            nickname: data.nickname || "",
            bio: data.bio || "",
            avatar: data.avatar || "",
            location: data.location || "",
            website: data.website || "",
          });
        })
        .catch(() => {
          // Profile may not exist yet, use defaults
        })
        .finally(() => setIsLoading(false));
    }
  }, [status, router, reset]);

  async function onSubmit(data: ProfileInput) {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "保存失败");
      }

      toast({
        title: "保存成功",
        description: "你的个人资料已更新",
      });
    } catch (err) {
      toast({
        title: "保存失败",
        description: err instanceof Error ? err.message : "请稍后重试",
        variant: "destructive",
      });
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-500" />
      </div>
    );
  }

  if (!session?.user) return null;

  const displayName =
    session.user.nickname || session.user.username || "用户";

  return (
    <div className="min-h-screen bg-stone-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-100">个人设置</h1>
          <p className="text-sm text-stone-500 mt-1">
            管理你的个人资料信息
          </p>
        </div>

        <Separator className="bg-stone-800 mb-8" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-stone-700">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-xl bg-stone-800 text-stone-300">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="avatar" className="text-stone-300">
                头像 URL
              </Label>
              <Input
                id="avatar"
                placeholder="https://example.com/avatar.jpg"
                className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600"
                {...register("avatar")}
              />
              {errors.avatar && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.avatar.message}
                </p>
              )}
            </div>
          </div>

          {/* Nickname */}
          <div>
            <Label htmlFor="nickname" className="text-stone-300">
              昵称
            </Label>
            <Input
              id="nickname"
              placeholder="给自己取个名字"
              className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600"
              {...register("nickname")}
            />
            {errors.nickname && (
              <p className="text-xs text-red-400 mt-1">
                {errors.nickname.message}
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio" className="text-stone-300">
              个人简介
            </Label>
            <Textarea
              id="bio"
              placeholder="用一两句话介绍自己..."
              rows={3}
              className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600 resize-none"
              {...register("bio")}
            />
            {errors.bio && (
              <p className="text-xs text-red-400 mt-1">
                {errors.bio.message}
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location" className="text-stone-300">
              所在地
            </Label>
            <Input
              id="location"
              placeholder="例如：北京"
              className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600"
              {...register("location")}
            />
            {errors.location && (
              <p className="text-xs text-red-400 mt-1">
                {errors.location.message}
              </p>
            )}
          </div>

          {/* Website */}
          <div>
            <Label htmlFor="website" className="text-stone-300">
              个人网站
            </Label>
            <Input
              id="website"
              placeholder="https://example.com"
              className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600"
              {...register("website")}
            />
            {errors.website && (
              <p className="text-xs text-red-400 mt-1">
                {errors.website.message}
              </p>
            )}
          </div>

          <Separator className="bg-stone-800" />

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              保存修改
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
