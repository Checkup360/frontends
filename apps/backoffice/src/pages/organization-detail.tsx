import { useEffect, useState } from "react"
import {
  getOrganizationSummary,
  type OrganizationSummaryResponse,
} from "@workspace/api"
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
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

function InviteMemberCard({
  organizationId,
  organizationName,
}: {
  organizationId: string
  organizationName: string
}) {
  const navigate = useNavigate()
  const inviteUrl = `/invitations?type=organization&organizationId=${encodeURIComponent(
    organizationId
  )}&create=1`

  return (
    <div className="w-full max-w-sm">
      <Card
        className="cursor-pointer transition-colors hover:ring-primary/40"
        onClick={() => navigate(inviteUrl)}
      >
        <CardContent>
          <Empty className="h-56 border border-dashed">
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadSummary() {
      if (!id) {
        setLoading(false)
        return
      }

      setLoading(true)
      const data = await getOrganizationSummary(id)
      if (active) {
        setSummary(data)
        setLoading(false)
      }
    }

    void loadSummary()

    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
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

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Total members"
          value={summary.total_members}
          icon={UsersRound}
        />
        <MetricCard
          label="Total members"
          value={summary.total_employees}
          icon={UsersRound}
        />
        <MetricCard
          label="Total admins"
          value={summary.total_admins}
          icon={ShieldCheck}
        />
      </section>

      <section className="flex justify-center">
        <InviteMemberCard organizationId={id} organizationName={summary.name} />
      </section>
    </div>
  )
}

export default OrganizationDetailPage
