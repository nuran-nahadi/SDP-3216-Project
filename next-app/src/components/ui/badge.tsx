import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border-2 px-3 py-1 text-xs font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5",
        secondary:
          "border-transparent bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground hover:from-secondary/90 hover:to-secondary/70",
        destructive:
          "border-transparent bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground shadow-md shadow-destructive/30 hover:shadow-lg hover:shadow-destructive/40",
        outline: "text-foreground border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50",
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
