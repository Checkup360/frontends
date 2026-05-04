import { useEffect, useMemo, type ReactNode } from "react"
import { resolveWebBaseUrl } from "@workspace/auth/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"

type RequireSysadminProps = {
  apiBaseUrl?: string
  webBaseUrl?: string
  fallback?: ReactNode
  children: ReactNode
}

export function RequireSysadmin({
  apiBaseUrl,
  webBaseUrl,
  fallback,
  children,
}: RequireSysadminProps) {
  const { user, isLoading } = useCurrentUser(apiBaseUrl)
  const homeUrl = useMemo(() => resolveWebBaseUrl(webBaseUrl), [webBaseUrl])

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.replace(homeUrl)
    }
  }, [homeUrl, isLoading, user])

  useEffect(() => {
    if (!isLoading && user && !user.is_sysadmin) {
      window.location.replace(window.location.origin)
    }
  }, [isLoading, user])

  if (isLoading || !user || !user.is_sysadmin) {
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
