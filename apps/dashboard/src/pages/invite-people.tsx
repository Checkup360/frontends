import { useMemo, useState } from "react"
import { SelectableOptionGroup } from "@workspace/components/components/selectable-option-group"
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
import { Separator } from "@workspace/ui/components/separator"
import { Check, Copy, MailPlus, ShieldCheck, UserRound } from "lucide-react"

type Role = "org_admin" | "employee"

const roles: Array<{
  value: Role
  label: string
  description: string
  icon: typeof ShieldCheck
}> = [
  {
    value: "org_admin",
    label: "Org admin",
    description: "Manage invitations, employees, and organization settings.",
    icon: ShieldCheck,
  },
  {
    value: "employee",
    label: "Employee",
    description: "Access personal onboarding and health checkups.",
    icon: UserRound,
  },
]

export function InvitePeoplePage() {
  const [role, setRole] = useState<Role>("employee")
  const [expiresInDays, setExpiresInDays] = useState("7")
  const [inviteUrl, setInviteUrl] = useState("")
  const [copied, setCopied] = useState(false)

  const selectedRole = useMemo(
    () => roles.find((item) => item.value === role) ?? roles[1],
    [role]
  )

  const handleGenerate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const token = Math.random().toString(36).slice(2, 10)
    const params = new URLSearchParams({ role })
    setInviteUrl(`${window.location.origin}/invite/${token}?${params.toString()}`)
    setCopied(false)
  }

  const handleCopy = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[1fr_380px]">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MailPlus className="size-5" />
            </div>
            <div>
              <CardTitle>Invite people</CardTitle>
              <CardDescription>
                Generate a shareable front-end invite preview for admins and employees.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form className="space-y-6" onSubmit={handleGenerate}>
            <div className="grid gap-3">
              <Label>Role</Label>
              <SelectableOptionGroup options={roles} value={role} onValueChange={setRole} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="invite-expiration">Expiration</Label>
              <Input
                id="invite-expiration"
                type="number"
                min="1"
                max="30"
                value={expiresInDays}
                onChange={(event) => setExpiresInDays(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">Number of days before the link expires.</p>
            </div>

            <Separator />

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit">
                <MailPlus className="size-4" />
                Generate invite
              </Button>
              <Button type="button" variant="outline" onClick={handleCopy} disabled={!inviteUrl}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <aside className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invite preview</CardTitle>
            <CardDescription>What will be encoded into the shared invitation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Role
              </p>
              <div className="mt-2 flex items-center gap-2">
                <selectedRole.icon className="size-4 text-primary" />
                <span className="text-sm font-medium">{selectedRole.label}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Expires
              </p>
              <p className="mt-1 text-sm font-medium">{expiresInDays || "7"} days</p>
            </div>
          </CardContent>
        </Card>

        {inviteUrl ? (
          <Card>
            <CardHeader>
              <CardTitle>Generated link</CardTitle>
              <CardDescription>Front-end preview only.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="break-all rounded-lg border border-border/60 bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
                {inviteUrl}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </aside>
    </div>
  )
}
