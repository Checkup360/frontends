import { useEffect } from "react"
import { resolveApiBaseUrl } from "@workspace/auth/api"

export default function Invite() {
  const token = window.location.pathname.split("/").pop()
  const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_URL as string | undefined)

  useEffect(() => {
    if (!token) {
      window.location.replace("/auth/error?reason=invalid_token")
      return
    }

    // Primero validar el invite en el backend y setear la cookie pending_invite
    const setPending = async () => {
      const resp = await fetch(`${apiBaseUrl}/auth/pending_invite`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_token: token }),
      })

      if (!resp.ok) {
        // redirigir a error con el detalle si lo hay
        try {
          const data = await resp.json()
          const reason = data.detail || "invalid_invite"
          window.location.replace(`/auth/error?reason=${encodeURIComponent(reason)}`)
          return
        } catch {
          window.location.replace("/auth/error?reason=invalid_invite")
          return
        }
      }

      // Ahora solicitar la URL de autorización de Google (fastapi-users la provee)
      // y redirigir al usuario al `authorization_url` que devuelve.
      try {
        const resp2 = await fetch(`${apiBaseUrl}/auth/google/authorize?invite_token=${token}`, {
          method: "GET",
          credentials: "include",
        })

        if (!resp2.ok) {
          // Si algo falla, redirigir a error genérico
          window.location.replace("/auth/error?reason=invalid_invite")
          return
        }

        const payload = await resp2.json()
        const authorizationUrl = payload.authorization_url
        if (typeof authorizationUrl === "string" && authorizationUrl.length > 0) {
          window.location.assign(authorizationUrl)
        } else {
          window.location.replace("/auth/error?reason=invalid_invite")
        }
      } catch (err) {
        window.location.replace("/auth/error?reason=invalid_invite")
      }
    }

    void setPending()
  }, [token, apiBaseUrl])

  return (
    <div className="mx-auto mt-20 max-w-xl text-center text-sm text-muted-foreground">
      Procesando tu invitación...
    </div>
  )
}
