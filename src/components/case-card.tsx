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
}: CaseCardProps) {
  return (
    <Link href={`/cases/${slug}`} className="block group">
      <Card className="h-full border-stone-800/60 bg-stone-900/50 hover:bg-stone-900/80 hover:border-amber-900/30 transition-all duration-200 hover:shadow-lg hover:shadow-amber-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-2">
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
          <h3 className="text-lg font-semibold text-stone-100 group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>
        </CardHeader>

        <CardContent className="pb-3">
          <p className="text-sm text-stone-400 line-clamp-2 leading-relaxed">
            {truncate(summary, 120)}
          </p>
        </CardContent>

        <CardFooter className="flex-col items-start gap-3 pt-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                {!isAnonymous && authorAvatar ? (
                  <AvatarImage src={authorAvatar} alt={authorName} />
                ) : null}
                <AvatarFallback className="text-xs bg-stone-800">
                  {isAnonymous ? (
                    <User className="h-3 w-3 text-stone-500" />
                  ) : (
                    authorName.charAt(0).toUpperCase()
                  )}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-stone-400">
                {isAnonymous ? "匿名" : authorName}
              </span>
              <span className="text-xs text-stone-600">·</span>
              <span className="text-xs text-stone-500">
                {formatDate(createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full text-stone-500">
            <span className="flex items-center gap-1 text-xs">
              <ThumbsUp className="h-3.5 w-3.5" />
              {usefulCount}
            </span>
            <span className="flex items-center gap-1 text-xs">
              <Heart className="h-3.5 w-3.5" />
              {resonanceCount}
            </span>
            <span className="flex items-center gap-1 text-xs">
              <MessageCircle className="h-3.5 w-3.5" />
              {commentCount}
            </span>
            <span className="flex items-center gap-1 text-xs ml-auto">
              <Bookmark className="h-3.5 w-3.5" />
              {bookmarkCount}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
