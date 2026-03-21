"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { failureCaseSchema, type FailureCaseInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save, ArrowLeft, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

export default function EditCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<FailureCaseInput>({
    resolver: zodResolver(failureCaseSchema),
    defaultValues: { isAnonymous: false, tagIds: [] },
  });

  const isAnonymous = watch("isAnonymous");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/tags").then((r) => r.json()),
      fetch(`/api/cases/${slug}`).then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      }),
    ])
      .then(([cats, tgs, caseData]) => {
        setCategories(Array.isArray(cats) ? cats : []);
        setTags(Array.isArray(tgs) ? tgs : []);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tagIds = caseData.tags?.map((t: any) => t.tag?.id || t.tagId) || [];
        setSelectedTags(tagIds);

        reset({
          title: caseData.title || "",
          summary: caseData.summary || "",
          categoryId: caseData.categoryId || "",
          tagIds,
          scene: caseData.scene || "",
          background: caseData.background || "",
          originalGoal: caseData.originalGoal || "",
          decisionPoint: caseData.decisionPoint || "",
          actionsTaken: caseData.actionsTaken || "",
          ignoredSignals: caseData.ignoredSignals || "",
          earliestWarning: caseData.earliestWarning || "",
          outcome: caseData.outcome || "",
          costTime: caseData.costTime || "",
          costMoney: caseData.costMoney || "",
          costRelationship: caseData.costRelationship || "",
          costOpportunity: caseData.costOpportunity || "",
          rootCause: caseData.rootCause || "",
          whatWouldDoDifferently: caseData.whatWouldDoDifferently || "",
          adviceToOthers: caseData.adviceToOthers || "",
          isAnonymous: caseData.isAnonymous || false,
        });
      })
      .catch(() => {
        toast({ title: "加载失败", description: "无法加载案例数据", variant: "destructive" });
        router.push("/my/cases");
      })
      .finally(() => setLoading(false));
  }, [slug, reset, router]);

  function toggleTag(tagId: string) {
    const next = selectedTags.includes(tagId)
      ? selectedTags.filter((t) => t !== tagId)
      : selectedTags.length < 5
        ? [...selectedTags, tagId]
        : selectedTags;
    setSelectedTags(next);
    setValue("tagIds", next, { shouldValidate: true });
  }

  async function onSubmit(data: FailureCaseInput) {
    setSaving(true);
    try {
      const res = await fetch(`/api/cases/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "保存失败");
      }
      toast({ title: "保存成功", description: "案例已更新" });
      router.push(`/cases/${slug}`);
    } catch (err) {
      toast({
        title: "保存失败",
        description: err instanceof Error ? err.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-500" />
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-stone-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-amber-400 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-100">编辑案例</h1>
          <p className="text-sm text-stone-500 mt-1">修改你的失败案例</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="title" className="text-stone-300">标题 *</Label>
            <Input id="title" className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100" {...register("title")} />
            {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="summary" className="text-stone-300">一句话总结 *</Label>
            <Textarea id="summary" rows={2} className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 resize-none" {...register("summary")} />
            {errors.summary && <p className="text-xs text-red-400 mt-1">{errors.summary.message}</p>}
          </div>

          <div>
            <Label className="text-stone-300">分类 *</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {categories.map((cat) => (
                <label key={cat.id} className="cursor-pointer">
                  <input type="radio" value={cat.id} className="sr-only peer" {...register("categoryId")} />
                  <span className="px-3 py-1.5 rounded-full text-xs font-medium border border-stone-700 text-stone-400 peer-checked:bg-amber-600 peer-checked:text-stone-50 peer-checked:border-amber-600 transition-colors">
                    {cat.name}
                  </span>
                </label>
              ))}
            </div>
            {errors.categoryId && <p className="text-xs text-red-400 mt-1">{errors.categoryId.message}</p>}
          </div>

          <div>
            <Label className="text-stone-300">标签 *（最多5个）</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedTags.includes(tag.id)
                      ? "bg-amber-600 text-stone-50"
                      : "bg-stone-800 text-stone-400 hover:text-stone-200"
                  }`}
                >
                  {tag.name}
                  {selectedTags.includes(tag.id) && <X className="inline h-3 w-3 ml-1" />}
                </button>
              ))}
            </div>
            {errors.tagIds && <p className="text-xs text-red-400 mt-1">{errors.tagIds.message}</p>}
          </div>

          <Separator className="bg-stone-800" />

          <div>
            <Label htmlFor="scene" className="text-stone-300">场景</Label>
            <Input id="scene" className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100" {...register("scene")} />
          </div>

          <div>
            <Label htmlFor="background" className="text-stone-300">背景 *</Label>
            <Textarea id="background" rows={4} className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 resize-none" {...register("background")} />
            {errors.background && <p className="text-xs text-red-400 mt-1">{errors.background.message}</p>}
          </div>

          <div>
            <Label htmlFor="originalGoal" className="text-stone-300">当时的目标 *</Label>
            <Textarea id="originalGoal" rows={3} className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 resize-none" {...register("originalGoal")} />
            {errors.originalGoal && <p className="text-xs text-red-400 mt-1">{errors.originalGoal.message}</p>}
          </div>

          <div>
            <Label htmlFor="decisionPoint" className="text-stone-300">关键决策点 *</Label>
            <Textarea id="decisionPoint" rows={3} className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 resize-none" {...register("decisionPoint")} />
            {errors.decisionPoint && <p className="text-xs text-red-400 mt-1">{errors.decisionPoint.message}</p>}
          </div>

          <div>
            <Label htmlFor="actionsTaken" className="text-stone-300">做了什么 *</Label>
            <Textarea id="actionsTaken" rows={3} className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 resize-none" {...register("actionsTaken")} />
            {errors.actionsTaken && <p className="text-xs text-red-400 mt-1">{errors.actionsTaken.message}</p>}
          </div>

          <div>
            <Label htmlFor="ignoredSignals" className="text-stone-300">忽略了什么信号 *</Label>
            <Textarea id="ignoredSignals" rows={3} className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 resize-none" {...register("ignoredSignals")} />
            {errors.ignoredSignals && <p className="text-xs text-red-400 mt-1">{errors.ignoredSignals.message}</p>}
          </div>

          <div>
            <Label htmlFor="earliestWarning" className="text-stone-300">最早的预警 *</Label>
            <Textarea id="earliestWarning" rows={3} className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 resize-none" {...register("earliestWarning")} />
            {errors.earliestWarning && <p className="text-xs text-red-400 mt-1">{errors.earliestWarning.message}</p>}
          </div>

          <div>
            <Label htmlFor="outcome" className="text-stone-300">最终结果 *</Label>
            <Textarea id="outcome" rows={3} className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 resize-none" {...register("outcome")} />
            {errors.outcome && <p className="text-xs text-red-400 mt-1">{errors.outcome.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="costTime" className="text-stone-300">时间成本</Label>
              <Input id="costTime" className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100" {...register("costTime")} />
            </div>
            <div>
              <Label htmlFor="costMoney" className="text-stone-300">金钱成本</Label>
              <Input id="costMoney" className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100" {...register("costMoney")} />
            </div>
            <div>
              <Label htmlFor="costRelationship" className="text-stone-300">关系成本</Label>
              <Input id="costRelationship" className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100" {...register("costRelationship")} />
            </div>
            <div>
              <Label htmlFor="costOpportunity" className="text-stone-300">机会成本</Label>
              <Input id="costOpportunity" className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100" {...register("costOpportunity")} />
            </div>
          </div>

          <Separator className="bg-stone-800" />

          <div>
            <Label htmlFor="rootCause" className="text-stone-300">根因分析 *</Label>
            <Textarea id="rootCause" rows={4} className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 resize-none" {...register("rootCause")} />
            {errors.rootCause && <p className="text-xs text-red-400 mt-1">{errors.rootCause.message}</p>}
          </div>

          <div>
            <Label htmlFor="whatWouldDoDifferently" className="text-stone-300">如果重来 *</Label>
            <Textarea id="whatWouldDoDifferently" rows={3} className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 resize-none" {...register("whatWouldDoDifferently")} />
            {errors.whatWouldDoDifferently && <p className="text-xs text-red-400 mt-1">{errors.whatWouldDoDifferently.message}</p>}
          </div>

          <div>
            <Label htmlFor="adviceToOthers" className="text-stone-300">给后来者的建议 *</Label>
            <Textarea id="adviceToOthers" rows={3} className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 resize-none" {...register("adviceToOthers")} />
            {errors.adviceToOthers && <p className="text-xs text-red-400 mt-1">{errors.adviceToOthers.message}</p>}
          </div>

          <Separator className="bg-stone-800" />

          <div className="flex items-center gap-3">
            <Checkbox
              id="isAnonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) =>
                setValue("isAnonymous", checked === true, { shouldValidate: true })
              }
            />
            <Label htmlFor="isAnonymous" className="text-stone-300 cursor-pointer">
              匿名发布
            </Label>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? (
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
