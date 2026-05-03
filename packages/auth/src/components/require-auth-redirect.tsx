import { useEffect, useMemo, type ReactNode } from "react"
import { buildLoginUrl } from "@workspace/auth/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"

type RequireAuthRedirectProps = {
  apiBaseUrl?: string
  webBaseUrl?: string
  children: ReactNode
}

export function RequireAuthRedirect({
  apiBaseUrl,
  webBaseUrl,
  children,
}: RequireAuthRedirectProps) {
  const { user, isLoading } = useCurrentUser(apiBaseUrl)
  const loginUrl = useMemo(
    () => buildLoginUrl({ webBaseUrl, nextUrl: window.location.href }),
    [webBaseUrl],
  )

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.replace(loginUrl)
    }
  }, [isLoading, loginUrl, user])

  if (isLoading || !user) return null

  return children
}
