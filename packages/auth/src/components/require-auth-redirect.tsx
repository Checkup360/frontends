import { useEffect, useMemo, type ReactNode } from "react"
import { buildLoginUrl } from "@workspace/auth/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"

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
    return (
      fallback ?? (
        <div className="flex min-h-svh items-center justify-center bg-background px-4 text-center text-sm text-muted-foreground">
          Redirecting to login...
        </div>
      )
    )
  }

  return children
}
