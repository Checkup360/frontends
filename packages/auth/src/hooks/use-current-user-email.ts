import { useEffect, useMemo, useState } from "react"
import { parseAuthMeResponse } from "@workspace/auth/schemas"

function normalizeApiBaseUrl(apiBaseUrl?: string): string {
  const raw = apiBaseUrl?.trim() || "http://localhost:8000"
  return raw.replace(/\/$/, "")
}

export function useCurrentUserEmail(apiBaseUrl?: string) {
  const [email, setEmail] = useState<string | null>(null)
  const resolvedApiBaseUrl = useMemo(() => normalizeApiBaseUrl(apiBaseUrl), [apiBaseUrl])

  useEffect(() => {
    let active = true

    const fetchMe = async () => {
      try {
        const response = await fetch(`${resolvedApiBaseUrl}/auth/me`, {
          credentials: "include",
        })
        if (!response.ok) return

        const payload = parseAuthMeResponse(await response.json())
        if (!payload) return
        if (active) setEmail(payload.email)
      } catch {
        // Keep null when request fails (e.g. no session/CORS/network).
      }
    }

    void fetchMe()
    return () => {
      active = false
    }
  }, [resolvedApiBaseUrl])

  return email
}
