import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Palette, UserRound, type LucideIcon } from "lucide-react"

export type SettingsSection = "account" | "appearance"

const navigationItems: Array<{
  value: SettingsSection
  label: string
  icon: LucideIcon
}> = [
  { value: "account", label: "Account", icon: UserRound },
  { value: "appearance", label: "Appearance", icon: Palette },
]

type SettingsNavigationProps = {
  value: SettingsSection
  onValueChange: (value: SettingsSection) => void
}

export function SettingsNavigation({
  value,
  onValueChange,
}: SettingsNavigationProps) {
  return (
    <aside className="w-full shrink-0 lg:w-56" aria-label="Settings">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className="md:hidden"
          aria-label="Settings section"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {navigationItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <nav className="hidden gap-1 md:flex lg:flex-col">
        {navigationItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.value}
              type="button"
              variant={value === item.value ? "secondary" : "ghost"}
              className="justify-start"
              aria-current={value === item.value ? "page" : undefined}
              onClick={() => onValueChange(item.value)}
            >
              <Icon />
              {item.label}
            </Button>
          )
        })}
      </nav>
    </aside>
  )
}
