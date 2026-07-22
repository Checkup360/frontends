import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import {
  MemberOverview,
  MemberOverviewSkeleton,
} from "@workspace/components/components/member-overview"
import { HealthContentGrid } from "@workspace/components/components/health-content-grid"
import { memberNewsArticles } from "@/components/member/news"

export function MemberOverviewPage() {
  const { user, isLoading } = useCurrentUser()

  if (isLoading) {
    return <MemberOverviewSkeleton />
  }

  if (!user?.email) {
    return null
  }

  return (
    <div className="space-y-10">
      <MemberOverview email={user.email} />
      <HealthContentGrid articles={memberNewsArticles} />
    </div>
  )
}

export default MemberOverviewPage
