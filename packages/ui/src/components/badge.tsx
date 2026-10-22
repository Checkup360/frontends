import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@workspace/ui/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        "info-light":
          "bg-blue-500/10 text-blue-500 focus-visible:ring-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:focus-visible:ring-blue-500/40",
        "warning-light":
          "bg-warning/10 text-warning focus-visible:ring-warning/20 dark:bg-warning/20 dark:focus-visible:ring-warning/40",
        "success-light":
          "bg-success/10 text-success focus-visible:ring-success/20 dark:bg-success/20 dark:focus-visible:ring-success/40",
        "risk-low":
          "bg-risk-low/10 text-risk-low border-risk-low/20 focus-visible:ring-risk-low/20 dark:bg-risk-low/15 dark:border-risk-low/30",
        "risk-moderate":
          "bg-risk-moderate/10 text-risk-moderate border-risk-moderate/20 focus-visible:ring-risk-moderate/20 dark:bg-risk-moderate/15 dark:border-risk-moderate/30",
        "risk-high":
          "bg-risk-high/10 text-risk-high border-risk-high/20 focus-visible:ring-risk-high/20 dark:bg-risk-high/15 dark:border-risk-high/30",
      },
      size: {
        default: "h-5 px-2 py-0.5 text-xs",
        xs: "h-4 px-1.5 py-0 text-[10px]",
        sm: "h-4.5 px-2 py-0.5 text-[11px]",
        lg: "h-6 px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
