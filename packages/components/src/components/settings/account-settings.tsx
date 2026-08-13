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
      title="Account"
      description="Information associated with your Checkup360 access."
    >
      <div className="space-y-6">
        <ReadOnlyField
          id="settings-email"
          label="Email address"
          value={email}
        />
        <ReadOnlyField
          id="settings-organization"
          label="Organization"
          value={organizationName ?? "No organization"}
        />
        <p className="text-sm text-muted-foreground">
          This information comes from your account and cannot be modified from this
          screen.
        </p>
        {action}
      </div>
    </SettingsContent>
  )
}
