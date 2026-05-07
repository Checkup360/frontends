import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

export default function InviteEntry() {
  const navigate = useNavigate()
  const [inviteToken, setInviteToken] = useState("")

  const handleContinue = () => {
    if (!inviteToken.trim()) {
      alert("Please enter a valid invitation token")
      return
    }
    navigate(`/invite/${encodeURIComponent(inviteToken.trim())}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleContinue()
    }
  }

  return (
    <div className="mx-auto mt-20 max-w-sm rounded-lg border border-gray-200 p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Bienvenido</h1>
      <p className="mt-2 text-sm text-gray-600">
        To get started, enter the invitation token you received
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <Label htmlFor="invite_token">Token de invitación</Label>
          <Input
            id="invite_token"
            type="text"
            placeholder="Paste your token here..."
            value={inviteToken}
            onChange={(e) => setInviteToken(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <Button onClick={handleContinue} className="w-full">
          Continuar
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-gray-500">
        ¿No tienes un token? Contacta al administrador
      </p>
    </div>
  )
}
