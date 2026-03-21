"use client";

import { useState, useEffect } from "react";
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
import {
  Loader2,
  Save,
  Send,
  ArrowLeft,
  AlertTriangle,
  Target,
  Crosshair,
  EyeOff,
  CheckCircle2,
  Search,
  X,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export default function PublishPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FailureCaseInput>({
    resolver: zodResolver(failureCaseSchema),
    defaultValues: {
      isAnonymous: false,
      tagIds: [],
    },
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
    ]).then(([cats, tgs]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setTags(Array.isArray(tgs) ? tgs : []);
    });
  }, []);

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
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, status: "PENDING" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "提交失败");
      }
      const result = await res.json();
      toast({ title: "提交成功", description: "案例已提交审核" });
      router.push(`/cases/${result.slug}`);
    } catch (err) {
      toast({
        title: "提交失败",
        description: err instanceof Error ? err.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveDraft() {
    setIsSavingDraft(true);
    const values = watch();
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, tagIds: selectedTags, status: "DRAFT" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "保存失败");
      }
      toast({ title: "草稿已保存", description: "可在「我的草稿」中继续编辑" });
      router.push("/my/drafts");
    } catch (err) {
      toast({
        title: "保存失败",
        description: err instanceof Error ? err.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSavingDraft(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-500" />
      </div>
    );
  }

  if (!session?.user) return null;

  const fieldGroups = [
    {
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      title: "基本信息",
      fields: (
        <>
          <div>
            <Label htmlFor="title" className="text-stone-300">标题 *</Label>
            <Input
              id="title"
              placeholder="用一句话概括这次失败"
              className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600"
              {...register("title")}
            />
            {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="summary" className="text-stone-300">一句话总结 *</Label>
            <Textarea
              id="summary"
              placeholder="简要总结这次失败的核心教训"
              rows={2}
              className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600 resize-none"
              {...register("summary")}
            />
            {errors.summary && <p className="text-xs text-red-400 mt-1">{errors.summary.message}</p>}
          </div>
          <div>
            <Label className="text-stone-300">分类 *</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {categories.map((cat) => (
                <label key={cat.id} className="cursor-pointer">
                  <input
                    type="radio"
                    value={cat.id}
                    className="sr-only peer"
                    {...register("categoryId")}
                  />
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
        </>
      ),
    },
    {
      icon: <Target className="h-5 w-5 text-amber-500" />,
      title: "背景与目标",
      fields: (
        <>
          <div>
            <Label htmlFor="scene" className="text-stone-300">场景（可选）</Label>
            <Input
              id="scene"
              placeholder="例如：创业、投资、职场、感情..."
              className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600"
              {...register("scene")}
            />
          </div>
          <div>
            <Label htmlFor="background" className="text-stone-300">背景 *</Label>
            <Textarea
              id="background"
              placeholder="详细描述事件发生的背景..."
              rows={4}
              className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600 resize-none"
              {...register("background")}
            />
            {errors.background && <p className="text-xs text-red-400 mt-1">{errors.background.message}</p>}
          </div>
          <div>
            <Label htmlFor="originalGoal" className="text-stone-300">当时的目标 *</Label>
            <Textarea
              id="originalGoal"
              placeholder="你当时想要达成什么目标？"
              rows={3}
              className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600 resize-none"
              {...register("originalGoal")}
            />
            {errors.originalGoal && <p className="text-xs text-red-400 mt-1">{errors.originalGoal.message}</p>}
          </div>
        </>
      ),
    },
    {
      icon: <Crosshair className="h-5 w-5 text-amber-500" />,
      title: "决策与行动",
      fields: (
        <>
          <div>
            <Label htmlFor="decisionPoint" className="text-stone-300">关键决策点 *</Label>
            <Textarea
              id="decisionPoint"
              placeholder="哪个决策导致了失败？"
              rows={3}
              className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600 resize-none"
              {...register("decisionPoint")}
            />
            {errors.decisionPoint && <p className="text-xs text-red-400 mt-1">{errors.decisionPoint.message}</p>}
          </div>
          <div>
            <Label htmlFor="actionsTaken" className="text-stone-300">做了什么 *</Label>
            <Textarea
              id="actionsTaken"
              placeholder="你采取了哪些行动？"
              rows={3}
              className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600 resize-none"
              {...register("actionsTaken")}
            />
            {errors.actionsTaken && <p className="text-xs text-red-400 mt-1">{errors.actionsTaken.message}</p>}
          </div>
        </>
      ),
    },
    {
      icon: <EyeOff className="h-5 w-5 text-red-400" />,
      title: "信号与预警",
      fields: (
        <>
          <div>
            <Label htmlFor="ignoredSignals" className="text-stone-300">忽略了什么信号 *</Label>
            <Textarea
              id="ignoredSignals"
              placeholder="事后看来，你当时忽略了哪些信号？"
              rows={3}
              className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600 resize-none"
              {...register("ignoredSignals")}
            />
            {errors.ignoredSignals && <p className="text-xs text-red-400 mt-1">{errors.ignoredSignals.message}</p>}
          </div>
          <div>
            <Label htmlFor="earliestWarning" className="text-stone-300">最早的预警 *</Label>
            <Textarea
              id="earliestWarning"
              placeholder="最早出现的不对劲的信号是什么？"
              rows={3}
              className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600 resize-none"
              {...register("earliestWarning")}
            />
            {errors.earliestWarning && <p className="text-xs text-red-400 mt-1">{errors.earliestWarning.message}</p>}
          </div>
        </>
      ),
    },
    {
      icon: <CheckCircle2 className="h-5 w-5 text-stone-400" />,
      title: "结果与代价",
      fields: (
        <>
          <div>
            <Label htmlFor="outcome" className="text-stone-300">最终结果 *</Label>
            <Textarea
              id="outcome"
              placeholder="最终发生了什么？"
              rows={3}
              className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600 resize-none"
              {...register("outcome")}
            />
            {errors.outcome && <p className="text-xs text-red-400 mt-1">{errors.outcome.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="costTime" className="text-stone-300">时间成本</Label>
              <Input id="costTime" placeholder="例如：3个月" className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600" {...register("costTime")} />
            </div>
            <div>
              <Label htmlFor="costMoney" className="text-stone-300">金钱成本</Label>
              <Input id="costMoney" placeholder="例如：10万" className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600" {...register("costMoney")} />
            </div>
            <div>
              <Label htmlFor="costRelationship" className="text-stone-300">关系成本</Label>
              <Input id="costRelationship" placeholder="例如：失去合伙人" className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600" {...register("costRelationship")} />
            </div>
            <div>
              <Label htmlFor="costOpportunity" className="text-stone-300">机会成本</Label>
              <Input id="costOpportunity" placeholder="例如：错过了更好的选择" className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600" {...register("costOpportunity")} />
            </div>
          </div>
        </>
      ),
    },
    {
      icon: <Search className="h-5 w-5 text-amber-500" />,
      title: "反思与建议",
      fields: (
        <>
          <div>
            <Label htmlFor="rootCause" className="text-stone-300">根因分析 *</Label>
            <Textarea
              id="rootCause"
              placeholder="你认为失败的根本原因是什么？"
              rows={4}
              className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600 resize-none"
              {...register("rootCause")}
            />
            {errors.rootCause && <p className="text-xs text-red-400 mt-1">{errors.rootCause.message}</p>}
          </div>
          <div>
            <Label htmlFor="whatWouldDoDifferently" className="text-stone-300">如果重来 *</Label>
            <Textarea
              id="whatWouldDoDifferently"
              placeholder="如果可以重来，你会怎么做？"
              rows={3}
              className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600 resize-none"
              {...register("whatWouldDoDifferently")}
            />
            {errors.whatWouldDoDifferently && <p className="text-xs text-red-400 mt-1">{errors.whatWouldDoDifferently.message}</p>}
          </div>
          <div>
            <Label htmlFor="adviceToOthers" className="text-stone-300">给后来者的建议 *</Label>
            <Textarea
              id="adviceToOthers"
              placeholder="你想对遇到类似情况的人说什么？"
              rows={3}
              className="mt-1.5 bg-stone-900/50 border-stone-700 text-stone-100 placeholder:text-stone-600 resize-none"
              {...register("adviceToOthers")}
            />
            {errors.adviceToOthers && <p className="text-xs text-red-400 mt-1">{errors.adviceToOthers.message}</p>}
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-stone-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-amber-400 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-100">分享失败案例</h1>
          <p className="text-sm text-stone-500 mt-1">
            用你的故事，照亮别人的路。带 * 的字段为必填。
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          {fieldGroups.map((group, idx) => (
            <div key={idx}>
              <div className="flex items-center gap-2 mb-4">
                {group.icon}
                <h2 className="text-lg font-semibold text-stone-100">{group.title}</h2>
              </div>
              <div className="space-y-4">{group.fields}</div>
              {idx < fieldGroups.length - 1 && <Separator className="bg-stone-800 mt-8" />}
            </div>
          ))}

          <Separator className="bg-stone-800" />

          {/* Anonymous toggle */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="isAnonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) =>
                setValue("isAnonymous", checked === true, { shouldValidate: true })
              }
            />
            <Label htmlFor="isAnonymous" className="text-stone-300 cursor-pointer">
              匿名发布（其他人不会看到你的身份）
            </Label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={saveDraft}
              disabled={isSavingDraft || isSubmitting}
            >
              {isSavingDraft ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              保存草稿
            </Button>
            <Button type="submit" disabled={isSubmitting || isSavingDraft}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1.5" />
              )}
              提交审核
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
