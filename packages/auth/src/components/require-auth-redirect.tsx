import { useEffect, useMemo, type ReactNode } from "react"
import { resolveWebBaseUrl } from "@workspace/auth/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"

type RequireAuthRedirectProps = {
  apiBaseUrl?: string
  webBaseUrl?: string
  fallback?: ReactNode
  children: ReactNode
}

export function RequireAuthRedirect({
  apiBaseUrl,
  webBaseUrl,
  fallback,
  children,
}: RequireAuthRedirectProps) {
  const { user, isLoading } = useCurrentUser(apiBaseUrl)
  const homeUrl = useMemo(() => resolveWebBaseUrl(webBaseUrl), [webBaseUrl])

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.replace(homeUrl)
    }
  }, [homeUrl, isLoading, user])

  if (isLoading || !user) {
    return (
      fallback ?? (
        <div className="flex min-h-svh items-center justify-center bg-background px-4 text-center text-sm text-muted-foreground">
          Redirigiendo al login...
        </div>
      )
    )
  }

  return children
}
