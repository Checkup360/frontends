import type * as React from "react"
import { MailPlus } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

type CreateInvitationButtonProps = React.ComponentProps<typeof Button>

export function CreateInvitationButton({
  children = "Create Invitation",
  className,
  ...props
}: CreateInvitationButtonProps) {
  return (
    <Button className={className} {...props}>
      <MailPlus className="size-4" />
      {children}
    </Button>
  )
}
