import type * as React from "react"
import type { LucideIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export interface ActionButtonProps extends React.ComponentProps<typeof Button> {
  icon?: LucideIcon
}

export function ActionButton({
  children,
  className,
  icon: Icon,
  variant = "default",
  ...props
}: ActionButtonProps) {
  return (
    <Button
      variant={variant}
      className={cn("gap-2 shadow-xs", className)}
      {...props}
    >
      {Icon && <Icon className="size-4" aria-hidden="true" />}
      {children}
    </Button>
  )
}
