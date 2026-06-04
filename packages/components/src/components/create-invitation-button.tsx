import type * as React from "react"
import { MailPlus } from "lucide-react"

import { ActionButton } from "./action-button"

type CreateInvitationButtonProps = React.ComponentProps<typeof ActionButton>

export function CreateInvitationButton({
  children = "Create Invitation",
  className,
  ...props
}: CreateInvitationButtonProps) {
  return (
    <ActionButton
      icon={MailPlus}
      className={className}
      {...props}
    >
      {children}
    </ActionButton>
  )
}
