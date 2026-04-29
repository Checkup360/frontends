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

  const loginUrl = useMemo(
    () => buildLoginUrl({ webBaseUrl, nextUrl: window.location.href }),
    [webBaseUrl]
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
    return (
      <div className="absolute top-4 right-4 z-20">
        <Button asChild variant="outline" size="sm">
          <a href={loginUrl}>Sign in</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="absolute top-4 right-4 z-20">
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
    </div>
  )
}
