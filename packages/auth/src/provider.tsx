"use client"

import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { fetchCurrentUser, type AuthMeResponse } from "@workspace/api"

export interface AuthContextValue {
  user: AuthMeResponse | null
  email: string | null
  isLoading: boolean
  refresh: () => Promise<void>
  clear: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthMeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchPromiseRef = useRef<Promise<void> | null>(null)


  const refresh = useCallback(async () => {
    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current
    }

    const runFetch = async () => {
      setIsLoading(true)
      try {
        const newUser = await fetchCurrentUser()
        setUser(newUser)
      } finally {
        setIsLoading(false)
        fetchPromiseRef.current = null
      }
    }

    fetchPromiseRef.current = runFetch()
    return fetchPromiseRef.current
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onLogout = () => setUser(null)
    const onForbidden = () => void refresh()
    
    window.addEventListener("auth-logout", onLogout)
    window.addEventListener("auth-forbidden", onForbidden)
    
    return () => {
      window.removeEventListener("auth-logout", onLogout)
      window.removeEventListener("auth-forbidden", onForbidden)
    }
  }, [refresh])

  const value: AuthContextValue = {
    user,
    email: user?.email ?? null,
    isLoading,
    refresh,
    clear: () => setUser(null),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
