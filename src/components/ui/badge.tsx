import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-stone-950",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-amber-600 text-stone-50 hover:bg-amber-700",
        secondary:
          "border-transparent bg-stone-800 text-stone-50 hover:bg-stone-700",
        destructive:
          "border-transparent bg-red-900 text-stone-50 hover:bg-red-900/80",
        outline:
          "border-stone-700 text-stone-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
