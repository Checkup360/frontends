import { useMemo, useState } from "react"
import { SelectableOptionGroup } from "@workspace/components/components/selectable-option-group"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Building2, MailPlus, Plus, Rocket, ShieldCheck } from "lucide-react"

type Plan = "starter" | "growth" | "enterprise"

const plans: Array<{
  value: Plan
  label: string
  description: string
  icon: typeof Building2
}> = [
  {
    value: "starter",
    label: "Starter",
    description: "Initial workspace for a small team or pending onboarding.",
    icon: Building2,
  },
  {
    value: "growth",
    label: "Growth",
    description: "Operational plan for growing organizations and active teams.",
    icon: Rocket,
  },
  {
    value: "enterprise",
    label: "Enterprise",
    description: "Full platform access for large workforces and admin oversight.",
    icon: ShieldCheck,
  },
]

export function InvitationsPage() {
  const [plan, setPlan] = useState<Plan>("growth")

  const selectedPlan = useMemo(
    () => plans.find((item) => item.value === plan) ?? plans[1],
    [plan]
  )

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MailPlus className="size-5" />
            </div>
            <div>
              <CardTitle>Create invitation</CardTitle>
              <CardDescription>
                Prepare a workspace invitation for an organization contact.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="organization">Organization</Label>
            <Input id="organization" placeholder="Select or type organization name" />
          </div>
          <div className="grid gap-3">
            <Label>Plan</Label>
            <SelectableOptionGroup
              options={plans}
              value={plan}
              onValueChange={setPlan}
              columnsClassName="md:grid-cols-3"
            />
          </div>
          <Button>
            <Plus className="size-4" />
            Generate invitation
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invitation preview</CardTitle>
          <CardDescription>Front-end state for the generated organization invite.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Selected plan
            </p>
            <div className="mt-2 flex items-center gap-2">
              <selectedPlan.icon className="size-4 text-primary" />
              <span className="text-sm font-medium">{selectedPlan.label}</span>
            </div>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Northwind Health</p>
                <p className="mt-1 text-xs text-muted-foreground">northwind.health</p>
              </div>
              <Badge variant="outline" className="border-transparent bg-[color:var(--warning)]/15 text-[color:var(--warning)]">
                Pending
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
