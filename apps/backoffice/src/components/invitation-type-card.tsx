import { Building2, ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import { cn } from "@workspace/ui/lib/utils"

type InvitationType = "sysadmin" | "organization"

interface InvitationTypeCardProps {
  onSelect: (type: InvitationType) => void
  onBack?: () => void
  loading?: boolean
  initialType?: InvitationType
}

const invitationTypes: Array<{
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

export function InvitationTypeCard({
  onSelect,
  onBack,
  loading,
  initialType = "sysadmin",
}: InvitationTypeCardProps) {
  const [selected, setSelected] = useState<InvitationType>(initialType)

  useEffect(() => {
    setSelected(initialType)
  }, [initialType])

  const handleContinue = () => {
    onSelect(selected)
  }

  return (
    <div className="flex flex-col">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Choose invitation type
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Select the access scope for the new invitation.
        </p>

        <RadioGroup
          value={selected}
          onValueChange={(value) => setSelected(value as InvitationType)}
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
          aria-label="Invitation type"
        >
          {invitationTypes.map((type) => {
            const Icon = type.icon
            const isSelected = selected === type.value

            return (
              <Label
                key={type.value}
                htmlFor={`invitation-${type.value}`}
                className={cn(
                  "flex cursor-pointer flex-col gap-3 rounded-lg border-2 p-6 transition-all sm:flex-row sm:items-start sm:gap-4",
                  "hover:border-primary/50 hover:bg-muted/40",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background"
                )}
              >
                <RadioGroupItem
                  id={`invitation-${type.value}`}
                  value={type.value}
                  disabled={loading}
                  className="hidden"
                />
                <div className="flex size-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-6" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-semibold text-foreground">
                    {type.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {type.description}
                  </p>
                </div>
              </Label>
            )
          })}
        </RadioGroup>
      </div>

      <div className="mt-6 flex items-center justify-between border-t pt-5">
        {onBack ? (
          <Button
            type="button"
            onClick={onBack}
            variant="outline"
            disabled={loading}
          >
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button type="button" onClick={handleContinue} disabled={loading}>
          Continue
        </Button>
      </div>
    </div>
  )
}
