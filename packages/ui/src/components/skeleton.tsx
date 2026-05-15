import { cn } from "@workspace/ui/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/70",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[skeleton-shimmer_1.8s_ease-in-out_infinite]",
        "after:bg-linear-to-r after:from-transparent after:via-background/55 after:to-transparent",
        "motion-reduce:after:animate-none",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
