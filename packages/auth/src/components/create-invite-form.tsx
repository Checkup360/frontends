import { useState } from "react"
import { createInvite } from "@workspace/auth/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

interface CreateInviteFormProps {
  apiBaseUrl?: string
}

export function CreateInviteForm({ apiBaseUrl }: CreateInviteFormProps) {
  const [email, setEmail] = useState("")
  const [expiresInHours, setExpiresInHours] = useState("24")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [inviteUrl, setInviteUrl] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    setInviteUrl("")

    try {
      const response = await createInvite(
        {
          email: email || undefined,
          expires_in_hours: parseInt(expiresInHours),
        },
        apiBaseUrl
      )

      if (!response) {
        setError("Error al crear la invitación")
        return
      }

      setSuccess(true)
      setInviteUrl(response.invite_url)
      setEmail("")
    } catch (err) {
      setError("Error inesperado al crear la invitación")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold">Crear invitación</h2>
      <p className="mt-2 text-sm text-gray-600">
        Genera un link de invitación para un nuevo usuario
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && inviteUrl && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm font-medium text-green-900">¡Invitación creada!</p>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={inviteUrl}
                readOnly
                className="flex-1 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(inviteUrl)
                  alert("¡Enlace copiado al portapapeles!")
                }}
              >
                Copiar
              </Button>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="email">Email (opcional)</Label>
          <Input
            id="email"
            type="email"
            placeholder="usuario@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Si lo especificas, la invitación solo será válida para este email
          </p>
        </div>

        <div>
          <Label htmlFor="expires_in_hours">Expira en (horas)</Label>
          <Input
            id="expires_in_hours"
            type="number"
            min="1"
            max="720"
            value={expiresInHours}
            onChange={(e) => setExpiresInHours(e.target.value)}
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creando..." : "Crear invitación"}
        </Button>
      </form>
    </div>
  )
}

export default CreateInviteForm
