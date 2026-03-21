"use client";

import Link from "next/link";
import { formatDate, truncate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ThumbsUp,
  Heart,
  MessageCircle,
  Bookmark,
  User,
  AlertTriangle,
  DollarSign,
} from "lucide-react";

interface CaseCardProps {
  slug: string;
  title: string;
  summary: string;
  categoryName: string;
  tags: string[];
  authorName: string;
  authorAvatar?: string;
  isAnonymous: boolean;
  createdAt: Date | string;
  usefulCount: number;
  resonanceCount: number;
  commentCount: number;
  bookmarkCount: number;
  costSummary?: string[];
  earliestWarningPreview?: string | null;
}

export function CaseCard({
  slug,
  title,
  summary,
  categoryName,
  tags,
  authorName,
  authorAvatar,
  isAnonymous,
  createdAt,
  usefulCount,
  resonanceCount,
  commentCount,
  bookmarkCount,
  costSummary,
  earliestWarningPreview,
}: CaseCardProps) {
  const hasCost = costSummary && costSummary.length > 0;
  const hasWarning = earliestWarningPreview && earliestWarningPreview.length > 0;

  return (
    <Link href={`/cases/${slug}`} className="block group">
      <Card className="h-full border-stone-800/60 bg-stone-900/50 hover:bg-stone-900/80 hover:border-amber-900/30 transition-all duration-200 hover:shadow-lg hover:shadow-amber-950/20 flex flex-col">
        <CardHeader className="pb-2">
          {/* Category + Tags */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="default" className="text-xs">
              {categoryName}
            </Badge>
            {tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <span className="text-xs text-stone-500">+{tags.length - 2}</span>
            )}
          </div>

          {/* Title - most prominent */}
          <h3 className="text-lg font-semibold text-stone-100 group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>
        </CardHeader>

        <CardContent className="pb-2 flex-1">
          {/* Summary */}
          <p className="text-sm text-stone-400 line-clamp-2 leading-relaxed mb-3">
            {truncate(summary, 120)}
          </p>

          {/* Cost & Warning indicators */}
          {(hasCost || hasWarning) && (
            <div className="space-y-1.5">
              {hasCost && (
                <div className="flex items-center gap-1.5 text-xs">
                  <DollarSign className="h-3 w-3 text-orange-400 shrink-0" />
                  <span className="text-orange-400/80">
                    代价：{costSummary.join("、")}
                  </span>
                </div>
              )}
              {hasWarning && (
                <div className="flex items-start gap-1.5 text-xs">
                  <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-amber-500/70 line-clamp-1">
                    {earliestWarningPreview}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-col items-start gap-3 pt-2">
          {/* Author & Time */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                {!isAnonymous && authorAvatar ? (
                  <AvatarImage src={authorAvatar} alt={authorName} />
                ) : null}
                <AvatarFallback className="text-[10px] bg-stone-800">
                  {isAnonymous ? (
                    <User className="h-2.5 w-2.5 text-stone-500" />
                  ) : (
                    authorName.charAt(0).toUpperCase()
                  )}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-stone-500">
                {isAnonymous ? "匿名" : authorName}
              </span>
              <span className="text-xs text-stone-600">·</span>
              <span className="text-xs text-stone-600">
                {formatDate(createdAt)}
              </span>
            </div>
          </div>

          {/* Interaction counts */}
          <div className="flex items-center gap-4 w-full text-stone-500">
            <span className="flex items-center gap-1 text-xs hover:text-amber-400 transition-colors">
              <ThumbsUp className="h-3 w-3" />
              {usefulCount}
            </span>
            <span className="flex items-center gap-1 text-xs hover:text-red-400 transition-colors">
              <Heart className="h-3 w-3" />
              {resonanceCount}
            </span>
            <span className="flex items-center gap-1 text-xs hover:text-blue-400 transition-colors">
              <MessageCircle className="h-3 w-3" />
              {commentCount}
            </span>
            <span className="flex items-center gap-1 text-xs ml-auto">
              <Bookmark className="h-3 w-3" />
              {bookmarkCount}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
