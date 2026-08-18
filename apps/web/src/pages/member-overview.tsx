import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import {
  MemberOverview,
  MemberOverviewSkeleton,
} from "@workspace/components/components/member-overview"
import { HealthContentGrid } from "@workspace/components/components/health-content-grid"
import { useMemberArticles } from "@/hooks/use-member-articles"

export function MemberOverviewPage() {
  const { user, isLoading: isUserLoading } = useCurrentUser()
  const { articles, isLoading: isArticlesLoading } = useMemberArticles()

  if (isUserLoading || isArticlesLoading) {
    return <MemberOverviewSkeleton />
  }

  if (!user?.email) {
    return null
  }

  return (
    <div className="space-y-10">
      <MemberOverview email={user.email} />
      <HealthContentGrid
        articles={articles}
        title="Health content"
        description="Personalized articles and wellness recommendations."
      />
    </div>
  )
}

export default MemberOverviewPage
