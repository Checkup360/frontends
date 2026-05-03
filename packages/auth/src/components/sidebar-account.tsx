import type { ReactNode } from "react"
import { logout } from "@workspace/auth/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Button } from "@workspace/ui/components/button"

type SidebarAccountProps = {
  apiBaseUrl: string
  inviteAction?: ReactNode
  roleLabel?: string
}

export function SidebarAccount({
  apiBaseUrl,
  inviteAction,
  roleLabel = "Organization member",
}: SidebarAccountProps) {
  const { email, isLoading, clear } = useCurrentUser(apiBaseUrl)

  const handleLogout = async () => {
    await logout(apiBaseUrl)
    clear()
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

  const initials = email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <div className="flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-primary/10 text-xs font-medium text-primary">
          {initials || "U"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{email}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{roleLabel}</p>
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
