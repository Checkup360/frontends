import { resolveVitePublicApiBaseUrl } from "@workspace/auth/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { useEffect } from "react"

export function DashboardPage() {
  const apiBaseUrl = resolveVitePublicApiBaseUrl(import.meta.env)
  const { user, isLoading } = useCurrentUser(apiBaseUrl)

  useEffect(() => {
    // Redirigir automáticamente a la página de member overview
    if (!isLoading && user) {
      window.location.href = "/member"
    }
  }, [isLoading, user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return null
}
