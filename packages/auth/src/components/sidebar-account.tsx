import type { ReactNode } from "react"
import { logout, resolveWebUrl } from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Button } from "@workspace/ui/components/button"

type SidebarAccountProps = {
  inviteAction?: ReactNode
  roleLabel?: string
}

export function SidebarAccount({
  inviteAction,
  roleLabel = "Organization member",
}: SidebarAccountProps) {
  const { user, email, isLoading, clear } = useCurrentUser()

  const handleLogout = async () => {
    await logout()
    clear()
    window.location.replace(resolveWebUrl())
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
        <div className="h-9 animate-pulse rounded-md bg-muted" />
      </div>
    )
  }

  if (!email) {
    return null
  }

  const firstName = user?.first_name?.trim()
  const lastName = user?.last_name?.trim()
  let displayName = ""
  if (firstName || lastName) {
    displayName = `${firstName ?? ""} ${lastName ?? ""}`.trim()
  } else {
    const prefix = email.split("@")[0] || email
    const parts = prefix.split(/[._-]+/).filter(Boolean)
    displayName =
      parts.length > 0
        ? parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")
        : prefix
  }

  const nameParts = displayName.split(" ").filter(Boolean)
  const initials =
    nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
      : nameParts.length === 1 && nameParts[0].length >= 2
        ? nameParts[0].slice(0, 2).toUpperCase()
        : email.slice(0, 2).toUpperCase()

  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <div className="flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-primary/10 text-xs font-medium text-primary">
          {initials || "U"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{email}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {inviteAction}
        <Button
          className={!inviteAction ? "col-span-2" : undefined}
          variant="ghost"
          size="sm"
          type="button"
          onClick={handleLogout}
        >
          Sign out
        </Button>
      </div>
    </div>
  )
}
