import { useState } from "react"
import { resolveApiBaseUrl } from "@workspace/auth/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const params = new URLSearchParams(window.location.search)
  const inviteToken = params.get("invite_token")

  const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_URL as string | undefined)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!inviteToken) {
      setError("Se requiere un token de invitación válido.")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          invite_token: inviteToken,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.detail || "Error al registrarse")
        return
      }

      // Registro exitoso, redirigir a login/complete
      window.location.href = "/login/complete"
    } catch (err) {
      setError("Error al conectar con el servidor")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-20 max-w-sm rounded-lg border border-gray-200 p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Registrarse</h1>
      <p className="mt-2 text-sm text-gray-600">Crea una cuenta con email y contraseña</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="Contraseña segura"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Registrando..." : "Registrarse"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        ¿Ya tienes cuenta? <a href="/login" className="font-medium text-blue-600 hover:underline">Inicia sesión</a>
      </p>
    </div>
  )
}
