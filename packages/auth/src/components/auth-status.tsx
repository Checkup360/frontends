import { useMemo, useState } from "react"
import { buildLoginUrl, logout } from "@workspace/auth/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Button } from "@workspace/ui/components/button"

type AuthStatusProps = {
  apiBaseUrl?: string
  webBaseUrl?: string
}

export function AuthStatus({ apiBaseUrl, webBaseUrl }: AuthStatusProps) {
  const { email, isLoading, clear } = useCurrentUser(apiBaseUrl)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isLoginRoute =
    window.location.pathname === "/login" ||
    window.location.pathname === "/login/complete"

  const loginUrl = useMemo(
    () => buildLoginUrl({ webBaseUrl, nextUrl: window.location.href }),
    [webBaseUrl],
  )

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout(apiBaseUrl)
      clear()
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (isLoading) return null

  if (!email) {
    if (isLoginRoute) return null

    return (
      <Button asChild variant="outline" size="sm">
        <a href={loginUrl}>Sign in</a>
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1 shadow-sm">
      <span className="max-w-44 truncate text-xs font-medium">{email}</span>
      <Button
        size="sm"
        variant="outline"
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? "Signing out..." : "Sign out"}
      </Button>
    </div>
  )
}
