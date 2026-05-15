import { useCallback, useEffect, useState } from "react"
import { fetchCurrentUser, type AuthMeResponse } from "@workspace/api"


export function useCurrentUser() {
  const [user, setUser] = useState<AuthMeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const newUser = await fetchCurrentUser()
      setUser(newUser)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onLogout = () => setUser(null)
    window.addEventListener("auth-logout", onLogout)
    return () => window.removeEventListener("auth-logout", onLogout)
  }, [])

  return {
    user,
    email: user?.email ?? null,
    isLoading,
    refresh,
    clear: () => setUser(null),
  }
}
