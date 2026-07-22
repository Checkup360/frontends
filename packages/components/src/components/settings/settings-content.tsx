import { Separator } from "@workspace/ui/components/separator"
import type { ReactNode } from "react"

type SettingsContentProps = {
  title: string
  description: string
  children: ReactNode
}

export function SettingsContent({
  title,
  description,
  children,
}: SettingsContentProps) {
  return (
    <section className="min-w-0 flex-1" aria-labelledby="settings-title">
      <div>
        <h2 id="settings-title" className="text-lg font-medium">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Separator className="my-5" />
      <div className="max-w-2xl">{children}</div>
    </section>
  )
}
