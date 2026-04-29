import { useCallback, useEffect, useMemo, useState } from "react"
import { fetchCurrentUser, resolveApiBaseUrl } from "@workspace/auth/api"
import type { AuthMeResponse } from "@workspace/auth/schemas"

export function useCurrentUser(apiBaseUrl?: string) {
  const [user, setUser] = useState<AuthMeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const resolvedApiBaseUrl = useMemo(() => resolveApiBaseUrl(apiBaseUrl), [apiBaseUrl])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      setUser(await fetchCurrentUser(resolvedApiBaseUrl))
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [resolvedApiBaseUrl])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    user,
    email: user?.email ?? null,
    isLoading,
    refresh,
    clear: () => setUser(null),
  }
}
