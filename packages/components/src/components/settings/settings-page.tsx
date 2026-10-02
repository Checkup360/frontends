import { Separator } from "@workspace/ui/components/separator"
import { useState, type ReactNode } from "react"
import { AccountSettings } from "./account-settings"
import { AppearanceSettings } from "./appearance-settings"
import { SettingsNavigation, type SettingsSection } from "./settings-navigation"

export type SettingsPageProps = {
  email: string
  organizationName?: string | null
  accountAction?: ReactNode
  avatarAction?: ReactNode
}

function ActiveSection({
  section,
  account,
}: {
  section: SettingsSection
  account: SettingsPageProps
}) {
  if (section === "appearance") return <AppearanceSettings />
  return (
    <AccountSettings
      {...account}
      action={account.accountAction}
      avatarAction={account.avatarAction}
    />
  )
}

export function SettingsPage(props: SettingsPageProps) {
  const [section, setSection] = useState<SettingsSection>("account")
  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and dashboard preferences.
        </p>
      </header>
      <Separator className="my-6" />
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <SettingsNavigation value={section} onValueChange={setSection} />
        <ActiveSection section={section} account={props} />
      </div>
    </div>
  )
}
