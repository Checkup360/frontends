import { useMemo, useState } from "react"
import { buildLoginUrl, logout, resolveVitePublicWebBaseUrl } from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Button } from "@workspace/ui/components/button"


export function AuthStatus() {
  const { email, isLoading, clear } = useCurrentUser()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isLoginRoute =
    window.location.pathname === "/login" ||
    window.location.pathname === "/login/complete"

  const loginUrl = useMemo(
    () => buildLoginUrl({ nextUrl: window.location.href }),
    []
  )

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      clear()
      window.location.replace(resolveVitePublicWebBaseUrl())
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
