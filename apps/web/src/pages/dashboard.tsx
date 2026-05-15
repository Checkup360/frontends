import { AuthLoadingSkeleton } from "@workspace/auth/components/auth-loading-skeleton"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { useEffect } from "react"

export function DashboardPage() {
  const { user, isLoading } = useCurrentUser()

  useEffect(() => {
    // Redirigir automáticamente a la página de member overview
    if (!isLoading && user) {
      window.location.href = "/member"
    }
  }, [isLoading, user])

  if (isLoading) {
    return <AuthLoadingSkeleton />
  }

  return null
}
