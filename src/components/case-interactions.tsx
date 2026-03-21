"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reportSchema, type ReportInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ThumbsUp,
  Heart,
  Bookmark,
  Share2,
  Flag,
  Loader2,
  Check,
} from "lucide-react";

interface CaseInteractionsProps {
  caseSlug: string;
  initialCounts: {
    useful: number;
    resonance: number;
    bookmarks: number;
    comments: number;
  };
  initialUserState: {
    hasVotedUseful: boolean;
    hasVotedResonance: boolean;
    hasBookmarked: boolean;
  };
}

const REPORT_REASONS = [
  "涉及他人隐私",
  "恶意挂人",
  "造谣诽谤",
  "广告/垃圾信息",
  "内容不实",
  "其他",
];

export function CaseInteractions({
  caseSlug,
  initialCounts,
  initialUserState,
}: CaseInteractionsProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [counts, setCounts] = useState(initialCounts);
  const [userState, setUserState] = useState(initialUserState);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    register: registerReport,
    handleSubmit: handleReportSubmit,
    setValue: setReportValue,
    reset: resetReport,
    formState: { errors: reportErrors },
  } = useForm<ReportInput>({
    resolver: zodResolver(reportSchema),
  });

  const requireAuth = useCallback(() => {
    if (!session?.user) {
      router.push("/login");
      return false;
    }
    return true;
  }, [session, router]);

  const toggleUseful = async () => {
    if (!requireAuth()) return;
    setLoadingAction("useful");

    // Optimistic update
    const wasVoted = userState.hasVotedUseful;
    setUserState((prev) => ({ ...prev, hasVotedUseful: !wasVoted }));
    setCounts((prev) => ({
      ...prev,
      useful: wasVoted ? prev.useful - 1 : prev.useful + 1,
    }));

    try {
      const res = await fetch(`/api/cases/${caseSlug}/useful`, {
        method: "POST",
      });
      if (!res.ok) {
        // Revert on failure
        setUserState((prev) => ({ ...prev, hasVotedUseful: wasVoted }));
        setCounts((prev) => ({
          ...prev,
          useful: wasVoted ? prev.useful + 1 : prev.useful - 1,
        }));
      }
    } catch {
      setUserState((prev) => ({ ...prev, hasVotedUseful: wasVoted }));
      setCounts((prev) => ({
        ...prev,
        useful: wasVoted ? prev.useful + 1 : prev.useful - 1,
      }));
    } finally {
      setLoadingAction(null);
    }
  };

  const toggleResonance = async () => {
    if (!requireAuth()) return;
    setLoadingAction("resonance");

    const wasVoted = userState.hasVotedResonance;
    setUserState((prev) => ({ ...prev, hasVotedResonance: !wasVoted }));
    setCounts((prev) => ({
      ...prev,
      resonance: wasVoted ? prev.resonance - 1 : prev.resonance + 1,
    }));

    try {
      const res = await fetch(`/api/cases/${caseSlug}/resonance`, {
        method: "POST",
      });
      if (!res.ok) {
        setUserState((prev) => ({ ...prev, hasVotedResonance: wasVoted }));
        setCounts((prev) => ({
          ...prev,
          resonance: wasVoted ? prev.resonance + 1 : prev.resonance - 1,
        }));
      }
    } catch {
      setUserState((prev) => ({ ...prev, hasVotedResonance: wasVoted }));
      setCounts((prev) => ({
        ...prev,
        resonance: wasVoted ? prev.resonance + 1 : prev.resonance - 1,
      }));
    } finally {
      setLoadingAction(null);
    }
  };

  const toggleBookmark = async () => {
    if (!requireAuth()) return;
    setLoadingAction("bookmark");

    const wasBookmarked = userState.hasBookmarked;
    setUserState((prev) => ({ ...prev, hasBookmarked: !wasBookmarked }));
    setCounts((prev) => ({
      ...prev,
      bookmarks: wasBookmarked ? prev.bookmarks - 1 : prev.bookmarks + 1,
    }));

    try {
      const res = await fetch(`/api/cases/${caseSlug}/bookmark`, {
        method: "POST",
      });
      if (!res.ok) {
        setUserState((prev) => ({ ...prev, hasBookmarked: wasBookmarked }));
        setCounts((prev) => ({
          ...prev,
          bookmarks: wasBookmarked ? prev.bookmarks + 1 : prev.bookmarks - 1,
        }));
      }
    } catch {
      setUserState((prev) => ({ ...prev, hasBookmarked: wasBookmarked }));
      setCounts((prev) => ({
        ...prev,
        bookmarks: wasBookmarked ? prev.bookmarks + 1 : prev.bookmarks - 1,
      }));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/cases/${caseSlug}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled share or clipboard failed
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Silently fail
      }
    }
  };

  const onReportSubmit = async (data: ReportInput) => {
    if (!requireAuth()) return;
    setReportSubmitting(true);

    try {
      const res = await fetch(`/api/cases/${caseSlug}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setReportOpen(false);
          setReportSuccess(false);
          resetReport();
        }, 1500);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "举报失败，请稍后再试");
      }
    } catch {
      alert("举报失败，请稍后再试");
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {/* Useful Vote */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={userState.hasVotedUseful ? "default" : "outline"}
            size="lg"
            onClick={toggleUseful}
            disabled={loadingAction === "useful"}
            className={
              userState.hasVotedUseful
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "border-stone-700 hover:border-amber-600/50 hover:text-amber-400"
            }
          >
            {loadingAction === "useful" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ThumbsUp
                className={`h-4 w-4 mr-2 ${userState.hasVotedUseful ? "fill-current" : ""}`}
              />
            )}
            有用 {counts.useful > 0 && counts.useful}
          </Button>
        </TooltipTrigger>
        <TooltipContent>这段经历让我少走弯路</TooltipContent>
      </Tooltip>

      {/* Resonance */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={userState.hasVotedResonance ? "default" : "outline"}
            size="lg"
            onClick={toggleResonance}
            disabled={loadingAction === "resonance"}
            className={
              userState.hasVotedResonance
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "border-stone-700 hover:border-red-600/50 hover:text-red-400"
            }
          >
            {loadingAction === "resonance" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Heart
                className={`h-4 w-4 mr-2 ${userState.hasVotedResonance ? "fill-current" : ""}`}
              />
            )}
            我也踩过这个坑 {counts.resonance > 0 && counts.resonance}
          </Button>
        </TooltipTrigger>
        <TooltipContent>感同身受，我也经历过</TooltipContent>
      </Tooltip>

      {/* Bookmark */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={userState.hasBookmarked ? "default" : "outline"}
            size="lg"
            onClick={toggleBookmark}
            disabled={loadingAction === "bookmark"}
            className={
              userState.hasBookmarked
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "border-stone-700 hover:border-blue-600/50 hover:text-blue-400"
            }
          >
            {loadingAction === "bookmark" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bookmark
                className={`h-4 w-4 mr-2 ${userState.hasBookmarked ? "fill-current" : ""}`}
              />
            )}
            收藏 {counts.bookmarks > 0 && counts.bookmarks}
          </Button>
        </TooltipTrigger>
        <TooltipContent>存起来，下次做决定前看看</TooltipContent>
      </Tooltip>

      {/* Share */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            onClick={handleShare}
            className="border-stone-700 hover:border-stone-500 hover:text-stone-200"
          >
            {copied ? (
              <Check className="h-4 w-4 mr-2 text-green-400" />
            ) : (
              <Share2 className="h-4 w-4 mr-2" />
            )}
            {copied ? "已复制" : "分享"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>分享此案例</TooltipContent>
      </Tooltip>

      {/* Report */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="lg"
                className="text-stone-500 hover:text-red-400 hover:bg-red-950/20"
              >
                <Flag className="h-4 w-4 mr-2" />
                举报
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>举报不当内容</TooltipContent>
        </Tooltip>
        <DialogContent className="bg-stone-900 border-stone-700">
          <DialogHeader>
            <DialogTitle className="text-stone-100">举报案例</DialogTitle>
            <DialogDescription className="text-stone-400">
              请选择举报原因。我们会尽快审核处理。
            </DialogDescription>
          </DialogHeader>

          {reportSuccess ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Check className="h-12 w-12 text-green-400" />
              <p className="text-stone-200">举报已提交，感谢你的反馈</p>
            </div>
          ) : (
            <form onSubmit={handleReportSubmit(onReportSubmit)}>
              <div className="space-y-4">
                <div>
                  <Label className="text-stone-200">举报原因</Label>
                  <Select
                    onValueChange={(value) => setReportValue("reason", value)}
                  >
                    <SelectTrigger className="mt-1.5 bg-stone-950 border-stone-700">
                      <SelectValue placeholder="请选择原因" />
                    </SelectTrigger>
                    <SelectContent className="bg-stone-900 border-stone-700">
                      {REPORT_REASONS.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {reportErrors.reason && (
                    <p className="text-sm text-red-400 mt-1">
                      {reportErrors.reason.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-stone-200">详细说明（可选）</Label>
                  <Textarea
                    {...registerReport("detail")}
                    placeholder="请补充具体情况..."
                    className="mt-1.5 bg-stone-950 border-stone-700 min-h-[80px]"
                  />
                  {reportErrors.detail && (
                    <p className="text-sm text-red-400 mt-1">
                      {reportErrors.detail.message}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter className="mt-6">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-stone-400"
                  >
                    取消
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={reportSubmitting}
                >
                  {reportSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  提交举报
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
