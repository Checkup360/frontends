import { useState } from "react"
import { Building2, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import { cn } from "@workspace/ui/lib/utils"

type InvitationType = "sysadmin" | "organization"

interface InvitationTypeSelectorProps {
  onSelect: (type: InvitationType) => void
  loading?: boolean
}

const options: Array<{
  value: InvitationType
  title: string
  description: string
  icon: typeof ShieldCheck
}> = [
  {
    value: "sysadmin",
    title: "Sysadmin registration",
    description: "Create a platform administrator invitation.",
    icon: ShieldCheck,
  },
  {
    value: "organization",
    title: "Organization registration",
    description: "Invite a user to an existing organization.",
    icon: Building2,
  },
]

export function InvitationTypeSelector({
  onSelect,
  loading,
}: InvitationTypeSelectorProps) {
  const [selected, setSelected] = useState<InvitationType>("sysadmin")

  return (
    <div className="flex min-h-[430px] flex-col">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Choose invitation type
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Select the access scope for the new invitation.
        </p>
      </div>

      <RadioGroup
        value={selected}
        onValueChange={(value) => setSelected(value as InvitationType)}
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
        aria-label="Invitation type"
      >
        {options.map((option) => {
          const Icon = option.icon
          const isSelected = selected === option.value

          return (
            <Label
              key={option.value}
              htmlFor={`invitation-type-${option.value}`}
              className={cn(
                "flex min-h-32 cursor-pointer items-start gap-5 rounded-xl border bg-background p-6 text-left transition-all",
                "hover:border-primary/50 hover:bg-muted/40 has-[[data-disabled]]:pointer-events-none has-[[data-disabled]]:opacity-50",
                isSelected
                  ? "border-primary bg-muted/30 ring-2 ring-primary"
                  : "border-border shadow-xs"
              )}
            >
              <RadioGroupItem
                id={`invitation-type-${option.value}`}
                value={option.value}
                disabled={loading}
                className="sr-only"
              />
              <span
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-lg",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="pt-0.5">
                <span className="block text-lg font-semibold text-foreground">
                  {option.title}
                </span>
                <span className="mt-1 block text-base leading-6 text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </Label>
          )
        })}
      </RadioGroup>

      <div className="min-h-20 flex-1" />

      <div className="flex items-center justify-between border-t pt-5">
        <Button type="button" variant="outline" disabled>
          <ChevronLeft className="size-4" />
          Back
        </Button>
        <Button
          type="button"
          onClick={() => onSelect(selected)}
          disabled={loading}
        >
          Continue
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
