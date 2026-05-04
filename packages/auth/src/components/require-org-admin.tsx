import { useEffect, useMemo, type ReactNode } from "react"
import { resolveWebBaseUrl } from "@workspace/auth/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"

type RequireOrgAdminProps = {
  apiBaseUrl?: string
  webBaseUrl?: string
  fallback?: ReactNode
  children: ReactNode
}

export function RequireOrgAdmin({
  apiBaseUrl,
  webBaseUrl,
  fallback,
  children,
}: RequireOrgAdminProps) {
  const { user, isLoading } = useCurrentUser(apiBaseUrl)
  const homeUrl = useMemo(() => resolveWebBaseUrl(webBaseUrl), [webBaseUrl])

  const isOrgAdmin = useMemo(
    () =>
      user &&
      user.memberships &&
      user.memberships.some((m) => m.role === "admin"),
    [user]
  )

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.replace(homeUrl)
    }
  }, [homeUrl, isLoading, user])

  useEffect(() => {
    if (!isLoading && user && !isOrgAdmin) {
      window.location.replace(window.location.origin)
    }
  }, [isLoading, user, isOrgAdmin])

  if (isLoading || !user || !isOrgAdmin) {
    return (
      fallback ?? (
        <div className="flex min-h-svh items-center justify-center bg-background px-4 text-center text-sm text-muted-foreground">
          Checking access...
        </div>
      )
    )
  }

  return children
}
