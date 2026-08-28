import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { Building2, Mail, ShieldCheck } from "lucide-react"
import type { ReactNode } from "react"

export type EmployeeProfileCardProps = {
  email: string
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  status: string
  roles: string[]
  departmentName?: string | null
  avatarUrl?: string
  action?: ReactNode
  className?: string
}

const statusClasses: Record<string, string> = {
  active:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  onboarding:
    "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
}

function getDisplayName(
  email: string,
  firstName?: string | null,
  lastName?: string | null,
  name?: string | null
) {
  if (name && name.trim()) return name.trim()
  if (firstName || lastName) {
    return `${firstName ?? ""} ${lastName ?? ""}`.trim()
  }
  const prefix = email.split("@")[0] || email
  const parts = prefix.split(/[._-]+/).filter(Boolean)
  if (parts.length > 0) {
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")
  }
  return prefix
}

function getInitials(displayName: string, email: string) {
  const parts = displayName.split(" ").filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function ProfileDetail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium text-foreground">
        {value}
      </span>
    </div>
  )
}

export function EmployeeProfileCard({
  email,
  name,
  firstName,
  lastName,
  status,
  roles,
  departmentName,
  avatarUrl,
  action,
  className,
}: EmployeeProfileCardProps) {
  const normalizedStatus = status.toLowerCase()
  const roleLabel = roles.includes("admin") ? "Administrator" : "Member"
  const displayName = getDisplayName(email, firstName, lastName, name)
  const initials = getInitials(displayName, email)

  return (
    <Card className={cn("p-0 flex flex-col justify-between", className)}>
      <CardContent className="flex flex-1 flex-col justify-between p-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="size-20">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback className="text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h2 className="mt-4 max-w-full truncate text-lg font-semibold text-foreground">
            {displayName}
          </h2>
          <p className="mt-1 flex max-w-full min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            <Mail className="size-3.5 shrink-0" />
            <span className="truncate">{email}</span>
          </p>
          {action && <div className="mt-5 w-full">{action}</div>}
        </div>

        <div className="mt-6 space-y-4 border-t border-border/60 pt-6">
          <ProfileDetail
            label="Department"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-3.5 text-muted-foreground" />
                {departmentName ?? "Unassigned"}
              </span>
            }
          />
          <ProfileDetail
            label="Status"
            value={
              <Badge
                variant="outline"
                className={cn("capitalize", statusClasses[normalizedStatus])}
              >
                {status}
              </Badge>
            }
          />
          <ProfileDetail
            label="Role"
            value={
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-muted-foreground" />
                {roleLabel}
              </span>
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}
