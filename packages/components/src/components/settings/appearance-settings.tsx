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
  { value: "light", label: "Claro", description: "Siempre claro", icon: Sun },
  { value: "dark", label: "Oscuro", description: "Siempre oscuro", icon: Moon },
  {
    value: "system",
    label: "Sistema",
    description: "Usar el dispositivo",
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
      title="Apariencia"
      description="Personalizá cómo se muestra Checkup360 en este dispositivo."
    >
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Tema</h3>
          <p className="text-sm text-muted-foreground">
            El cambio se guarda automáticamente.
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
