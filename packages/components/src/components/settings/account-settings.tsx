import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import type { ReactNode } from "react"
import { SettingsContent } from "./settings-content"

function ReadOnlyField({
  id,
  label,
  value,
}: {
  id: string
  label: string
  value: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} disabled readOnly />
    </div>
  )
}

type AccountSettingsProps = {
  email: string
  organizationName?: string | null
  action?: ReactNode
}

export function AccountSettings({
  email,
  organizationName,
  action,
}: AccountSettingsProps) {
  return (
    <SettingsContent
      title="Cuenta"
      description="Información asociada a tu acceso a Checkup360."
    >
      <div className="space-y-6">
        <ReadOnlyField
          id="settings-email"
          label="Correo electrónico"
          value={email}
        />
        <ReadOnlyField
          id="settings-organization"
          label="Organización"
          value={organizationName ?? "Sin organización"}
        />
        <p className="text-sm text-muted-foreground">
          Estos datos provienen de tu cuenta y no se pueden modificar desde esta
          pantalla.
        </p>
        {action}
      </div>
    </SettingsContent>
  )
}
