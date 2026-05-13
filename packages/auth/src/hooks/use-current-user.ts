import { useCallback, useEffect, useMemo, useState } from "react"
import { fetchCurrentUser, resolveApiBaseUrl } from "@workspace/auth/api"
import type { AuthMeResponse } from "@workspace/auth/schemas"

function getAuthCookie(): string | null {
  const cookies = document.cookie.split("; ")
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=")
    if (name === "auth") {
      return value || null
    }
  }
  return null
}

export function useCurrentUser(apiBaseUrl?: string) {
  const [user, setUser] = useState<AuthMeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastAuthCookie, setLastAuthCookie] = useState<string | null>(getAuthCookie())
  const resolvedApiBaseUrl = useMemo(() => resolveApiBaseUrl(apiBaseUrl), [apiBaseUrl])

  const refresh = useCallback(
    async (backgroundRefresh = false) => {
      // Solo cambiar isLoading si no es refresh en background o si es la carga inicial
      if (!backgroundRefresh) {
        setIsLoading(true)
      }
      try {
        const newUser = await fetchCurrentUser(resolvedApiBaseUrl)
        setUser(newUser)
        // Si pasamos de no tener usuario a tener usuario, no marcar isLoading false aún
        // para dar tiempo a que se actualicen los componentes
        if (!backgroundRefresh) {
          setIsLoading(false)
        }
      } catch {
        setUser(null)
        if (!backgroundRefresh) {
          setIsLoading(false)
        }
      }
    },
    [resolvedApiBaseUrl]
  )

  useEffect(() => {
    void refresh(false)
  }, [refresh])

  // Monitor auth cookie changes to detect login/logout
  useEffect(() => {
    const interval = setInterval(() => {
      const currentCookie = getAuthCookie()
      if (currentCookie !== lastAuthCookie) {
        setLastAuthCookie(currentCookie)
        // Hacer refresh en background (sin cambiar isLoading)
        void refresh(true)
      }
    }, 500) // Check every 500ms

    return () => clearInterval(interval)
  }, [lastAuthCookie, refresh])

  return {
    user,
    email: user?.email ?? null,
    isLoading,
    refresh,
    clear: () => setUser(null),
  }
}
