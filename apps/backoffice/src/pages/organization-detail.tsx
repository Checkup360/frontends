import { useEffect, useMemo, useState } from "react"
import {
  getOrganizationRegistrationTrends,
  getOrganizationSummary,
  type OrganizationSummaryResponse,
  type RegistrationTrendPoint,
} from "@workspace/api"
import {
  ScoreEvolutionChart,
  type ChartSeries,
} from "@workspace/components/components/score-evolution-chart"
import {
  Avatar,
  AvatarGroup,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { cn } from "@workspace/ui/lib/utils"


function InviteMemberCard({
  organizationId,
  organizationName,
  className,
}: {
  organizationId: string
  organizationName: string
  className?: string
}) {
  const navigate = useNavigate()
  const inviteUrl = `/invitations?type=organization&organizationId=${encodeURIComponent(
    organizationId
  )}&create=1`

  return (
    <div className={cn("w-full", className)}>
      <Card
        className="h-full cursor-pointer transition-colors hover:ring-primary/40 flex flex-col justify-center"
        onClick={() => navigate(inviteUrl)}
      >
        <CardContent className="h-full p-6 flex flex-col justify-center">
          <Empty className="h-full min-h-[260px] border border-dashed flex flex-col justify-center">
            <EmptyHeader>
              <EmptyMedia>
                <AvatarGroup>
                  <Avatar size="lg">
                    <AvatarImage
                      src="https://images.shadcnspace.com/assets/profiles/jenny.webp"
                      alt="Team member avatar"
                    />
                  </Avatar>
                  <Avatar size="lg">
                    <AvatarImage
                      src="https://images.shadcnspace.com/assets/profiles/albert.webp"
                      alt="Team member avatar"
                    />
                  </Avatar>
                  <Avatar size="lg">
                    <AvatarImage
                      src="https://images.shadcnspace.com/assets/profiles/jessica.webp"
                      alt="Team member avatar"
                    />
                  </Avatar>
                </AvatarGroup>
              </EmptyMedia>
              <EmptyTitle>Invite to Organization</EmptyTitle>
              <EmptyDescription>
                Create an invitation directly for {organizationName}.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                asChild
                size="sm"
                className="cursor-pointer hover:bg-primary/80"
                onClick={(event) => event.stopPropagation()}
              >
                <Link to={inviteUrl}>Invite to Organization</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: LucideIcon
}) {
  return (
    <Card className="border-border/60 shadow-[var(--shadow-card)]">
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
          </div>
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export function OrganizationDetailPage() {
  const { id } = useParams()
  const [summary, setSummary] = useState<OrganizationSummaryResponse | null>(
    null
  )
  const [registrationTrends, setRegistrationTrends] = useState<
    RegistrationTrendPoint[]
  >([])
  const [loading, setLoading] = useState(true)
  const [loadingTrends, setLoadingTrends] = useState(true)

  useEffect(() => {
    let active = true

    async function loadData() {
      if (!id) {
        setLoading(false)
        setLoadingTrends(false)
        return
      }

      setLoading(true)
      setLoadingTrends(true)

      try {
        const [summaryData, trendsData] = await Promise.all([
          getOrganizationSummary(id),
          getOrganizationRegistrationTrends(id),
        ])

        if (active) {
          setSummary(summaryData)
          setRegistrationTrends(trendsData)
        }
      } finally {
        if (active) {
          setLoading(false)
          setLoadingTrends(false)
        }
      }
    }

    void loadData()

    return () => {
      active = false
    }
  }, [id])

  const chartSeries: ChartSeries[] = useMemo(
    () => [
      {
        key: "cumulative_members",
        label: "Total Members",
        color: "oklch(0.65 0.18 250)",
      },
      {
        key: "new_members",
        label: "New Registrations",
        color: "oklch(0.62 0.20 145)",
      },
    ],
    []
  )

  const chartData = useMemo(() => {
    return registrationTrends.map((point) => ({
      month: point.date_label,
      new_members: point.new_members,
      cumulative_members: point.cumulative_members,
    }))
  }, [registrationTrends])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent>
                <div className="h-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!id || !summary) {
    return (
      <div className="mx-auto flex min-h-[55vh] w-full max-w-3xl flex-col items-center justify-center text-center">
        <h2 className="text-xl font-semibold text-foreground">
          Organization not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The selected organization does not exist or could not be loaded.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Back to organizations</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl animate-in space-y-6 duration-300 fade-in">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link to="/">
          <ArrowLeft className="size-4" />
          Back to organizations
        </Link>
      </Button>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          Organization
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          {summary.name}
        </h2>
        <p className="text-sm text-muted-foreground">{summary.slug}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total users"
          value={summary.total_members}
          icon={Users}
        />
        <MetricCard
          label="Employees"
          value={summary.total_employees}
          icon={UsersRound}
        />
        <MetricCard
          label="Admins"
          value={summary.total_admins}
          icon={ShieldCheck}
        />
        <MetricCard
          label="Content managers"
          value={summary.total_content_managers}
          icon={FileText}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-stretch">
        <div className="lg:col-span-2">
          <ScoreEvolutionChart
            title="User Registrations Evolution"
            description="User registration progression over time"
            badgeLabel={
              registrationTrends.length > 0
                ? `${summary.total_members} users total`
                : undefined
            }
            icon={Users}
            data={chartData}
            series={chartSeries}
            xAxisKey="month"
            showDots={true}
            showPercentages={false}
            loading={loadingTrends}
            emptyTitle="No registrations recorded yet"
            emptyMessage="Member registration trends will appear here as users join this organization."
            height={260}
            className="h-full"
          />
        </div>

        <div className="lg:col-span-1 flex">
          <InviteMemberCard
            organizationId={id}
            organizationName={summary.name}
            className="h-full w-full"
          />
        </div>
      </section>
    </div>
  )
}

export default OrganizationDetailPage
