import { Button } from "@workspace/ui/components/button"
import { Switch } from "@workspace/ui/components/switch"
import { useState } from "react"
import { SettingsContent } from "./settings-content"

type NotificationPreference = "risk" | "reminders" | "summary"

const preferenceItems: Array<{
  id: NotificationPreference
  title: string
  description: string
}> = [
  {
    id: "risk",
    title: "Alertas de riesgo",
    description: "Avisos sobre indicadores que requieren atención.",
  },
  {
    id: "reminders",
    title: "Recordatorios",
    description: "Seguimiento de evaluaciones y tareas pendientes.",
  },
  {
    id: "summary",
    title: "Resumen semanal",
    description: "Un repaso de la actividad de la organización.",
  },
]

const defaultPreferences: Record<NotificationPreference, boolean> = {
  risk: true,
  reminders: true,
  summary: false,
}

function PreferenceRow({
  item,
  checked,
  onCheckedChange,
}: {
  item: (typeof preferenceItems)[number]
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-xl border border-border/70 p-4">
      <div className="space-y-1">
        <label
          htmlFor={`notification-${item.id}`}
          className="text-sm font-medium"
        >
          {item.title}
        </label>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </div>
      <Switch
        id={`notification-${item.id}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState(defaultPreferences)
  return (
    <SettingsContent
      title="Notificaciones"
      description="Elegí qué comunicaciones querés recibir."
    >
      <div className="space-y-4">
        {preferenceItems.map((item) => (
          <PreferenceRow
            key={item.id}
            item={item}
            checked={preferences[item.id]}
            onCheckedChange={(checked) =>
              setPreferences((current) => ({ ...current, [item.id]: checked }))
            }
          />
        ))}
        <p className="text-sm text-muted-foreground">
          La sincronización con el servidor todavía no está disponible; estos
          cambios no se guardarán.
        </p>
        <Button type="button" disabled>
          Guardar preferencias
        </Button>
      </div>
    </SettingsContent>
  )
}
