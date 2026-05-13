import { useEffect, useMemo, type ReactNode } from "react"
import { buildLoginUrl } from "@workspace/auth/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"

type RequireSysadminProps = {
  apiBaseUrl?: string
  fallback?: ReactNode
  children: ReactNode
}

export function RequireSysadmin({
  apiBaseUrl,
  fallback,
  children,
}: RequireSysadminProps) {
  const { user, isLoading } = useCurrentUser(apiBaseUrl)
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
