import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CaseCardSkeletonProps {
  className?: string;
}

export function CaseCardSkeleton({ className }: CaseCardSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-stone-800/60 bg-stone-900/50 p-6 space-y-4",
        className
      )}
    >
      {/* Category and tags */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
      </div>

      {/* Summary */}
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Author and time */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>

      {/* Counts */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-10" />
        <div className="ml-auto">
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </div>
  );
}

interface CaseCardSkeletonGridProps {
  count?: number;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function CaseCardSkeletonGrid({
  count = 6,
  columns = 3,
  className,
}: CaseCardSkeletonGridProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-5", gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CaseCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CaseListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-stone-800/60 bg-stone-900/50 p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-20 text-center space-y-6">
      <Skeleton className="h-12 w-40 mx-auto" />
      <Skeleton className="h-8 w-2/3 mx-auto" />
      <Skeleton className="h-5 w-1/2 mx-auto" />
      <div className="flex justify-center gap-4 pt-4">
        <Skeleton className="h-11 w-40 rounded-md" />
        <Skeleton className="h-11 w-40 rounded-md" />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4 sm:gap-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="text-center p-6 rounded-xl bg-stone-900/40 border border-stone-800/50"
        >
          <Skeleton className="h-10 w-20 mx-auto mb-2" />
          <Skeleton className="h-4 w-16 mx-auto" />
        </div>
      ))}
    </div>
  );
}
