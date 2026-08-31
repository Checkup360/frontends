import { useNavigate } from "react-router-dom"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import {
  MemberOverview,
  MemberOverviewSkeleton,
} from "@workspace/components/components/member-overview"
import { HealthContentGrid } from "@workspace/components/components/health-content-grid"
import { useMemberArticles } from "@/hooks/use-member-articles"

export function MemberOverviewPage() {
  const navigate = useNavigate()
  const { user, isLoading: isUserLoading } = useCurrentUser()
  const { articles, isLoading: isArticlesLoading } = useMemberArticles()

  if (isUserLoading || isArticlesLoading) {
    return <MemberOverviewSkeleton />
  }

  if (!user?.email) {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10">
      <MemberOverview
        email={user.email}
        firstName={user.first_name}
        lastName={user.last_name}
      />
      <HealthContentGrid
        articles={articles}
        title="Health content"
        description="Personalized articles and wellness recommendations."
        onNavigate={(href) => navigate(href)}
      />
    </div>
  )
}

export default MemberOverviewPage
