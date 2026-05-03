import type { LucideIcon } from "lucide-react"
import { Check } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

type SelectableOption = {
  value: string
  label: string
  description: string
  icon: LucideIcon
}

type SelectableOptionGroupProps<TOption extends SelectableOption> = {
  options: TOption[]
  value: TOption["value"]
  onValueChange: (value: TOption["value"]) => void
  columnsClassName?: string
  selectedLabel?: string
}

export function SelectableOptionGroup<TOption extends SelectableOption>({
  options,
  value,
  onValueChange,
  columnsClassName = "sm:grid-cols-2",
  selectedLabel = "Selected",
}: SelectableOptionGroupProps<TOption>) {
  return (
    <div className={cn("grid gap-3", columnsClassName)}>
      {options.map((item) => {
        const selected = value === item.value

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onValueChange(item.value)}
            className={cn(
              "rounded-lg border border-border/70 bg-background p-4 text-left transition-colors hover:bg-muted/50",
              selected && "border-primary bg-primary/5 ring-2 ring-primary/15"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <item.icon className="size-4 text-primary" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {selected ? (
                <Badge variant="secondary">
                  <Check className="size-3" />
                  {selectedLabel}
                </Badge>
              ) : null}
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{item.description}</p>
          </button>
        )
      })}
    </div>
  )
}
