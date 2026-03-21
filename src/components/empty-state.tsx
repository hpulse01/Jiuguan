import { Wine, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon = Wine,
  title = "这里还没有故事...",
  description = "酒馆今夜很安静，也许你可以成为第一个开口的人",
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      <div className="rounded-full bg-stone-900/60 border border-stone-800/50 p-6 mb-6">
        <Icon className="h-10 w-10 text-stone-600" />
      </div>
      <h3 className="text-lg font-medium text-stone-300 mb-2">{title}</h3>
      <p className="text-sm text-stone-500 max-w-md">{description}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
