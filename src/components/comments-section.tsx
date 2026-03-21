"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { commentSchema, type CommentInput } from "@/lib/validations";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  ThumbsUp,
  Reply,
  Loader2,
  User,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";

interface CommentAuthor {
  id: string;
  username: string;
  profile: {
    nickname: string | null;
    avatar: string | null;
  } | null;
}

interface CommentReply {
  id: string;
  content: string;
  commentType: string;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  caseId: string;
  parentId: string | null;
  author: CommentAuthor;
  _count: {
    likes: number;
  };
}

interface Comment {
  id: string;
  content: string;
  commentType: string;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  caseId: string;
  parentId: string | null;
  author: CommentAuthor;
  _count: {
    likes: number;
  };
  replies: CommentReply[];
}

interface CommentsSectionProps {
  caseSlug: string;
  initialComments: Comment[];
}

const COMMENT_TYPES: Record<string, { label: string; color: string }> = {
  QUESTION: { label: "追问", color: "text-blue-400 bg-blue-950/30 border-blue-800/30" },
  SUPPLEMENT: { label: "补充经历", color: "text-green-400 bg-green-950/30 border-green-800/30" },
  DISAGREEMENT: { label: "不同意见", color: "text-orange-400 bg-orange-950/30 border-orange-800/30" },
  ALTERNATIVE: { label: "替代方案", color: "text-purple-400 bg-purple-950/30 border-purple-800/30" },
};

export function CommentsSection({
  caseSlug,
  initialComments,
}: CommentsSectionProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [likingComment, setLikingComment] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set()
  );

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const handleLike = async (commentId: string) => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    setLikingComment(commentId);
    const wasLiked = likedComments.has(commentId);

    // Optimistic update
    setLikedComments((prev) => {
      const next = new Set(prev);
      if (wasLiked) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });

    const updateCommentLikes = (list: Comment[]) =>
      list.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            _count: {
              ...c._count,
              likes: wasLiked ? c._count.likes - 1 : c._count.likes + 1,
            },
          };
        }
        return {
          ...c,
          replies: c.replies.map((r) => {
            if (r.id === commentId) {
              return {
                ...r,
                _count: {
                  ...r._count,
                  likes: wasLiked ? r._count.likes - 1 : r._count.likes + 1,
                },
              };
            }
            return r;
          }),
        };
      });

    setComments(updateCommentLikes);

    try {
      const res = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
      });
      if (!res.ok) {
        // Revert
        setLikedComments((prev) => {
          const next = new Set(prev);
          if (wasLiked) {
            next.add(commentId);
          } else {
            next.delete(commentId);
          }
          return next;
        });
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                _count: {
                  ...c._count,
                  likes: wasLiked ? c._count.likes + 1 : c._count.likes - 1,
                },
              };
            }
            return {
              ...c,
              replies: c.replies.map((r) => {
                if (r.id === commentId) {
                  return {
                    ...r,
                    _count: {
                      ...r._count,
                      likes: wasLiked
                        ? r._count.likes + 1
                        : r._count.likes - 1,
                    },
                  };
                }
                return r;
              }),
            };
          })
        );
      }
    } catch {
      // Revert on error silently
    } finally {
      setLikingComment(null);
    }
  };

  const handleNewComment = (comment: Comment) => {
    if (comment.parentId) {
      // It's a reply - add to parent's replies
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === comment.parentId) {
            return {
              ...c,
              replies: [...c.replies, comment as unknown as CommentReply],
            };
          }
          return c;
        })
      );
      // Auto-expand replies for parent
      setExpandedReplies((prev) => {
        const next = new Set(prev);
        if (comment.parentId) next.add(comment.parentId);
        return next;
      });
    } else {
      // Top-level comment
      setComments((prev) => [...prev, { ...comment, replies: [] }]);
    }
    setReplyingTo(null);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="h-5 w-5 text-amber-500" />
        <h2 className="text-xl font-semibold text-stone-100">
          讨论区
          <span className="text-sm font-normal text-stone-500 ml-2">
            {comments.reduce((acc, c) => acc + 1 + c.replies.length, 0)} 条评论
          </span>
        </h2>
      </div>

      {/* New comment form */}
      <CommentForm
        caseSlug={caseSlug}
        onCommentCreated={handleNewComment}
      />

      <Separator className="my-6 bg-stone-800" />

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-10 w-10 text-stone-700 mx-auto mb-3" />
          <p className="text-stone-500">
            还没有评论，来分享你的看法吧
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                onLike={handleLike}
                isLiked={likedComments.has(comment.id)}
                isLiking={likingComment === comment.id}
                onReply={() =>
                  setReplyingTo(
                    replyingTo === comment.id ? null : comment.id
                  )
                }
                isReplying={replyingTo === comment.id}
              />

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="ml-8 mt-2">
                  <button
                    onClick={() => toggleReplies(comment.id)}
                    className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-amber-400 transition-colors mb-3"
                  >
                    {expandedReplies.has(comment.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    {comment.replies.length} 条回复
                  </button>

                  {expandedReplies.has(comment.id) && (
                    <div className="space-y-4 border-l-2 border-stone-800 pl-4">
                      {comment.replies.map((reply) => (
                        <CommentItem
                          key={reply.id}
                          comment={reply}
                          onLike={handleLike}
                          isLiked={likedComments.has(reply.id)}
                          isLiking={likingComment === reply.id}
                          isReply
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reply form */}
              {replyingTo === comment.id && (
                <div className="ml-8 mt-3">
                  <CommentForm
                    caseSlug={caseSlug}
                    parentId={comment.id}
                    onCommentCreated={handleNewComment}
                    onCancel={() => setReplyingTo(null)}
                    compact
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  onLike,
  isLiked,
  isLiking,
  onReply,
  isReplying,
  isReply,
}: {
  comment: Comment | CommentReply;
  onLike: (id: string) => void;
  isLiked: boolean;
  isLiking: boolean;
  onReply?: () => void;
  isReplying?: boolean;
  isReply?: boolean;
}) {
  const authorName =
    comment.author.profile?.nickname || comment.author.username;
  const authorAvatar = comment.author.profile?.avatar;
  const typeInfo = COMMENT_TYPES[comment.commentType];

  return (
    <div className={`group ${isReply ? "" : "py-1"}`}>
      <div className="flex gap-3">
        <Avatar className={isReply ? "h-7 w-7" : "h-9 w-9"}>
          {authorAvatar ? (
            <AvatarImage src={authorAvatar} alt={authorName} />
          ) : null}
          <AvatarFallback
            className={`bg-stone-800 ${isReply ? "text-xs" : "text-sm"}`}
          >
            {comment.isAnonymous ? (
              <User className="h-3 w-3 text-stone-500" />
            ) : (
              authorName.charAt(0).toUpperCase()
            )}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`font-medium text-stone-200 ${isReply ? "text-sm" : ""}`}
            >
              {authorName}
            </span>
            {typeInfo && (
              <Badge
                variant="outline"
                className={`text-xs px-1.5 py-0 ${typeInfo.color}`}
              >
                {typeInfo.label}
              </Badge>
            )}
            <span className="text-xs text-stone-600">
              {formatDate(comment.createdAt)}
            </span>
          </div>

          <p
            className={`text-stone-300 leading-relaxed whitespace-pre-wrap ${
              isReply ? "text-sm" : ""
            }`}
          >
            {comment.content}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => onLike(comment.id)}
              disabled={isLiking}
              className={`flex items-center gap-1 text-xs transition-colors ${
                isLiked
                  ? "text-amber-400"
                  : "text-stone-500 hover:text-amber-400"
              }`}
            >
              <ThumbsUp
                className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`}
              />
              {comment._count.likes > 0 && comment._count.likes}
            </button>
            {onReply && (
              <button
                onClick={onReply}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  isReplying
                    ? "text-amber-400"
                    : "text-stone-500 hover:text-amber-400"
                }`}
              >
                <Reply className="h-3.5 w-3.5" />
                回复
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentForm({
  caseSlug,
  parentId,
  onCommentCreated,
  onCancel,
  compact,
}: {
  caseSlug: string;
  parentId?: string;
  onCommentCreated: (comment: Comment) => void;
  onCancel?: () => void;
  compact?: boolean;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CommentInput>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
      commentType: "QUESTION",
      isAnonymous: false,
      parentId: parentId || undefined,
    },
  });

  const isAnonymous = watch("isAnonymous");

  const onSubmit = async (data: CommentInput) => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/cases/${caseSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          parentId: parentId || undefined,
        }),
      });

      if (res.ok) {
        const newComment = await res.json();
        // Format for local state
        const formatted: Comment = {
          ...newComment,
          createdAt:
            typeof newComment.createdAt === "string"
              ? newComment.createdAt
              : new Date(newComment.createdAt).toISOString(),
          updatedAt:
            typeof newComment.updatedAt === "string"
              ? newComment.updatedAt
              : new Date(newComment.updatedAt).toISOString(),
          author: newComment.isAnonymous
            ? {
                id: newComment.author.id,
                username: "匿名用户",
                profile: { nickname: "匿名用户", avatar: null },
              }
            : {
                id: newComment.author.id,
                username: newComment.author.username,
                profile: {
                  nickname: newComment.author.profile?.nickname || null,
                  avatar: newComment.author.profile?.avatar || null,
                },
              },
          replies: [],
        };
        onCommentCreated(formatted);
        reset();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "评论失败，请稍后再试");
      }
    } catch {
      alert("评论失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  };

  if (!session?.user) {
    return (
      <Card className="border-stone-800/60 bg-stone-900/40">
        <CardContent className="py-6 text-center">
          <p className="text-stone-400 mb-3">登录后参与讨论</p>
          <Button
            variant="outline"
            onClick={() => router.push("/login")}
            className="border-amber-700/50 text-amber-400 hover:bg-amber-950/30"
          >
            去登录
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`border-stone-800/60 bg-stone-900/40 ${compact ? "border-amber-900/30" : ""}`}
    >
      <CardContent className={compact ? "py-4" : "pt-6"}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-3">
            {!compact && (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="text-stone-300 text-sm">评论类型</Label>
                  <Select
                    defaultValue="QUESTION"
                    onValueChange={(value) =>
                      setValue(
                        "commentType",
                        value as CommentInput["commentType"]
                      )
                    }
                  >
                    <SelectTrigger className="mt-1 bg-stone-950 border-stone-700 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-stone-900 border-stone-700">
                      <SelectItem value="QUESTION">追问</SelectItem>
                      <SelectItem value="SUPPLEMENT">补充经历</SelectItem>
                      <SelectItem value="DISAGREEMENT">不同意见</SelectItem>
                      <SelectItem value="ALTERNATIVE">替代方案</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Switch
                    checked={isAnonymous}
                    onCheckedChange={(checked) =>
                      setValue("isAnonymous", checked)
                    }
                  />
                  <Label className="text-sm text-stone-400">匿名评论</Label>
                </div>
              </div>
            )}

            {compact && (
              <div className="flex items-center gap-3 mb-1">
                <Select
                  defaultValue="QUESTION"
                  onValueChange={(value) =>
                    setValue(
                      "commentType",
                      value as CommentInput["commentType"]
                    )
                  }
                >
                  <SelectTrigger className="w-32 bg-stone-950 border-stone-700 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-900 border-stone-700">
                    <SelectItem value="QUESTION">追问</SelectItem>
                    <SelectItem value="SUPPLEMENT">补充经历</SelectItem>
                    <SelectItem value="DISAGREEMENT">不同意见</SelectItem>
                    <SelectItem value="ALTERNATIVE">替代方案</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={isAnonymous}
                    onCheckedChange={(checked) =>
                      setValue("isAnonymous", checked)
                    }
                    className="scale-75"
                  />
                  <span className="text-xs text-stone-500">匿名</span>
                </div>
              </div>
            )}

            <Textarea
              {...register("content")}
              placeholder={
                parentId ? "写下你的回复..." : "分享你的看法、补充经历或提出问题..."
              }
              className={`bg-stone-950 border-stone-700 focus-visible:ring-amber-500/40 ${
                compact ? "min-h-[60px]" : "min-h-[100px]"
              }`}
            />
            {errors.content && (
              <p className="text-sm text-red-400">{errors.content.message}</p>
            )}

            <div className="flex items-center justify-end gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="text-stone-400"
                >
                  取消
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1.5" />
                )}
                {parentId ? "回复" : "发表评论"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
