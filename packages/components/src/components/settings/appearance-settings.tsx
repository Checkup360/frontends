import { useTheme, type Theme } from "@workspace/ui/components/theme-provider"
import { Label } from "@workspace/ui/components/label"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react"
import { SettingsContent } from "./settings-content"

const themeOptions: Array<{
  value: Theme
  label: string
  description: string
  icon: LucideIcon
}> = [
  { value: "light", label: "Light", description: "Always light", icon: Sun },
  { value: "dark", label: "Dark", description: "Always dark", icon: Moon },
  {
    value: "system",
    label: "System",
    description: "Use device settings",
    icon: Monitor,
  },
]

function ThemeOption({ option }: { option: (typeof themeOptions)[number] }) {
  const Icon = option.icon
  return (
    <Label
      htmlFor={`theme-${option.value}`}
      className="cursor-pointer rounded-xl border border-border/70 p-4 transition-colors hover:bg-muted/50 has-data-checked:border-primary has-data-checked:bg-muted/70"
    >
      <div className="flex items-start gap-3">
        <RadioGroupItem
          id={`theme-${option.value}`}
          value={option.value}
          className="mt-0.5"
        />
        <Icon className="size-4" />
        <span className="space-y-1">
          <span className="block font-medium text-foreground">
            {option.label}
          </span>
          <span className="block text-xs font-normal text-muted-foreground">
            {option.description}
          </span>
        </span>
      </div>
    </Label>
  )
}

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  return (
    <SettingsContent
      title="Appearance"
      description="Customize how Checkup360 looks on this device."
    >
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Theme</h3>
          <p className="text-sm text-muted-foreground">
            Changes are saved automatically.
          </p>
        </div>
        <RadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as Theme)}
          className="grid gap-3 sm:grid-cols-3"
        >
          {themeOptions.map((option) => (
            <ThemeOption key={option.value} option={option} />
          ))}
        </RadioGroup>
      </div>
    </SettingsContent>
  )
}
