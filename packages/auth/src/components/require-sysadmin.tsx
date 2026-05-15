import { useEffect, useMemo, type ReactNode } from "react"
import { buildLoginUrl } from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { AuthLoadingSkeleton } from "./auth-loading-skeleton"

type RequireSysadminProps = {
  fallback?: ReactNode
  children: ReactNode
}

export function RequireSysadmin({
  fallback,
  children,
}: RequireSysadminProps) {
  const { user, isLoading } = useCurrentUser()
  const loginUrl = useMemo(
    () => buildLoginUrl({ nextUrl: window.location.href }),
    [],
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
    if (!isLoading && user && !user.is_sysadmin) {
      const timer = setTimeout(() => {
        window.location.replace(`${window.location.origin}/access-denied`)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isLoading, user])

  if (isLoading || !user || !user.is_sysadmin) {
    return fallback ?? <AuthLoadingSkeleton />
  }

  return children
}
