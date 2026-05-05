import { resolveVitePublicApiBaseUrl } from "@workspace/auth/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { AlertCircle, CheckCircle2, Clock, Heart } from "lucide-react"
import { StatCard } from "@/components/stat-card"

export function MemberOverviewPage() {
  const apiBaseUrl = resolveVitePublicApiBaseUrl(import.meta.env)
  const { user, isLoading } = useCurrentUser(apiBaseUrl)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const organization = user?.memberships?.[0]

  return (
    <div className="space-y-8">
      {/* Risk Score Banner */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-4xl font-bold tracking-tight text-destructive">
                  42
                </span>
                <span className="text-xs text-muted-foreground">out of 100</span>
              </div>
              <div className="flex-1">
                <div className="mb-1 text-right text-xs font-medium text-muted-foreground">
                  Moderate risk
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-destructive"
                    style={{ width: "42%" }}
                  />
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Complete your health checkup to improve your score.
            </p>
          </CardContent>
        </Card>

        <StatCard
          label="Checkups Completed"
          value="3"
          hint="of 4 this year"
          icon={CheckCircle2}
          tone="success"
          delta={20}
        />

        <StatCard
          label="Pending Forms"
          value="1"
          hint="Due in 5 days"
          icon={Clock}
          tone="warning"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Health Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Health Summary</CardTitle>
            <CardDescription>Your organization health metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-[color:var(--success)]" />
                <span className="text-sm font-medium">Wellness Status</span>
              </div>
              <span className="text-sm text-[color:var(--success)]">Good</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[color:var(--warning)]" />
                <span className="text-sm font-medium">Alerts</span>
              </div>
              <span className="text-sm text-[color:var(--warning)]">1 warning</span>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleDateString("en-US", { 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and resources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full rounded-lg border border-border/60 bg-background p-3 text-left text-sm font-medium transition-colors hover:bg-muted/50">
              📋 Complete Health Checkup
            </button>
            <button className="w-full rounded-lg border border-border/60 bg-background p-3 text-left text-sm font-medium transition-colors hover:bg-muted/50">
              📞 Schedule Appointment
            </button>
            <button className="w-full rounded-lg border border-border/60 bg-background p-3 text-left text-sm font-medium transition-colors hover:bg-muted/50">
              📚 View Resources
            </button>
            <button className="w-full rounded-lg border border-border/60 bg-background p-3 text-left text-sm font-medium transition-colors hover:bg-muted/50">
              💬 Contact Support
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest actions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-3 border-b border-border/40 pb-3 last:border-b-0">
              <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Health checkup submitted</p>
                <p className="text-xs text-muted-foreground">3 days ago</p>
              </div>
            </div>
            <div className="flex gap-3 border-b border-border/40 pb-3 last:border-b-0">
              <div className="h-2 w-2 rounded-full bg-[color:var(--warning)] mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">New form assigned</p>
                <p className="text-xs text-muted-foreground">5 days ago</p>
              </div>
            </div>
            <div className="flex gap-3 border-b border-border/40 pb-3 last:border-b-0">
              <div className="h-2 w-2 rounded-full bg-[color:var(--success)] mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">You joined {organization?.organization_name}</p>
                <p className="text-xs text-muted-foreground">1 month ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
