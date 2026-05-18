import { submitMemberDetails } from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { CalendarDays } from "lucide-react"
import { useMemo, useState } from "react"
import { Navigate } from "react-router-dom"

import { AuthShell } from "@/components/auth/auth-shell"

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

export function MemberOnboardingPage() {
  const { user, isLoading, refresh } = useCurrentUser()
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const maxDate = useMemo(() => todayIsoDate(), [])

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-center text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!user.requires_onboarding) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await submitMemberDetails({
        date_of_birth: dateOfBirth,
      })

      if (result.error) {
        setError(result.error.message)
        return
      }

      await refresh()
      window.location.replace("/")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Complete your profile"
      description="Enter your birth date to continue to your member dashboard."
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        {error ? (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="date-of-birth">Date of birth</Label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="date-of-birth"
              type="date"
              required
              max={maxDate}
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
              disabled={isSubmitting}
              className="pl-8"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Continue"}
        </Button>
      </form>
    </AuthShell>
  )
}
