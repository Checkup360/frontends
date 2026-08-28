import { useEffect, useMemo, type ReactNode } from "react"
import { buildLoginUrl } from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { AuthLoadingSkeleton } from "./auth-loading-skeleton"

type RequireOrgRoleProps = {
  allowedRoles: string[]
  fallback?: ReactNode
  children: ReactNode
}

export function RequireOrgRole({
  allowedRoles,
  fallback,
  children,
}: RequireOrgRoleProps) {
  const { user, isLoading } = useCurrentUser()
  const loginUrl = useMemo(
    () => buildLoginUrl({ nextUrl: window.location.href }),
    [],
  )

  const hasAllowedRole = useMemo(
    () =>
      user &&
      user.membership &&
      user.membership.roles?.some((r) => allowedRoles.includes(r)),
    [user, allowedRoles]
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
    if (!isLoading && user && !hasAllowedRole) {
      const timer = setTimeout(() => {
        window.location.replace(`${window.location.origin}/access-denied`)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isLoading, user, hasAllowedRole])

  if (isLoading || !user || !hasAllowedRole) {
    return fallback ?? <AuthLoadingSkeleton />
  }

  return children
}
