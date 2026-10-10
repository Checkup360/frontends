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
  OverviewStatCard,
  OverviewStatCardSkeleton,
} from "@workspace/components/components/card"
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
        className="flex h-full cursor-pointer flex-col justify-center rounded-xl border border-border/60 bg-card shadow-xs transition-colors hover:border-primary/40"
        onClick={() => navigate(inviteUrl)}
      >
        <CardContent className="flex h-full flex-col justify-center p-6">
          <Empty className="flex h-full min-h-[260px] flex-col justify-center rounded-xl border border-dashed border-border/60 bg-muted/15">
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
                className="cursor-pointer rounded-lg hover:bg-primary/80"
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
            <OverviewStatCardSkeleton key={index} />
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
        <OverviewStatCard
          label="Total users"
          value={summary.total_members.toString()}
          icon={Users}
          iconVariant="icon"
          tone="primary"
        />
        <OverviewStatCard
          label="Employees"
          value={summary.total_employees.toString()}
          icon={UsersRound}
          iconVariant="icon"
          tone="primary"
        />
        <OverviewStatCard
          label="Admins"
          value={summary.total_admins.toString()}
          icon={ShieldCheck}
          iconVariant="icon"
          tone="primary"
        />
        <OverviewStatCard
          label="Content managers"
          value={summary.total_content_managers.toString()}
          icon={FileText}
          iconVariant="icon"
          tone="primary"
        />
      </section>

      <section className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
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

        <div className="flex lg:col-span-1">
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
