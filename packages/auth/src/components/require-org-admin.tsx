import { useEffect, useMemo, type ReactNode } from "react"
import { buildLoginUrl } from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { AuthLoadingSkeleton } from "./auth-loading-skeleton"

type RequireOrgAdminProps = {
  fallback?: ReactNode
  children: ReactNode
}

export function RequireOrgAdmin({
  fallback,
  children,
}: RequireOrgAdminProps) {
  const { user, isLoading } = useCurrentUser()
  const loginUrl = useMemo(
    () => buildLoginUrl({ nextUrl: window.location.href }),
    [],
  )

  const isOrgAdmin = useMemo(
    () =>
      user &&
      user.memberships &&
      user.memberships.some((m) => m.roles?.includes("admin")),
    [user]
  )

  useEffect(() => {
    if (!isLoading && !user) {
      const timer = setTimeout(() => {
        window.location.replace(loginUrl)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isLoading, loginUrl, user])

  useEffect(() => {
    if (!isLoading && user && !isOrgAdmin) {
      const timer = setTimeout(() => {
        window.location.replace(`${window.location.origin}/access-denied`)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isLoading, user, isOrgAdmin])

  if (isLoading || !user || !isOrgAdmin) {
    return fallback ?? <AuthLoadingSkeleton />
  }

  return children
}
