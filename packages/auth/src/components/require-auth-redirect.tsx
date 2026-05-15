import { useEffect, useMemo, type ReactNode } from "react"
import { buildLoginUrl } from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { AuthLoadingSkeleton } from "./auth-loading-skeleton"

type RequireAuthRedirectProps = {
  fallback?: ReactNode
  children: ReactNode
}

export function RequireAuthRedirect({
  fallback,
  children,
}: RequireAuthRedirectProps) {
  const { user, isLoading } = useCurrentUser()
  const loginUrl = useMemo(
    () => buildLoginUrl({ nextUrl: window.location.href }),
    [],
  )

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.replace(loginUrl)
    }
  }, [isLoading, loginUrl, user])

  if (isLoading || !user) {
    return fallback ?? <AuthLoadingSkeleton />
  }

  return children
}
