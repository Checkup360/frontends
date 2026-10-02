import { useNavigate } from "react-router-dom"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import {
  MemberOverview,
  MemberOverviewSkeleton,
} from "@workspace/components/components/member-overview"
import { HealthContentGrid } from "@workspace/components/components/health-content-grid"
import { useArticleFilters } from "@/hooks/use-article-filters"
import { useMemberArticles } from "@/hooks/use-member-articles"

export function MemberOverviewPage() {
  const navigate = useNavigate()
  const { user, isLoading: isUserLoading } = useCurrentUser()
  const filters = useArticleFilters()
  const {
    articles,
    categories,
    categoryLabels,
    isLoading: isArticlesLoading,
    isFetching: isArticlesFetching,
  } = useMemberArticles({
    category: filters.category,
    search: filters.search,
  })

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
        avatarUrl={user.avatar_url}
      />
      <HealthContentGrid
        articles={articles}
        categories={categories}
        categoryLabels={categoryLabels}
        selectedCategory={filters.category}
        onCategoryChange={filters.changeCategory}
        search={filters.searchInput}
        onSearchChange={filters.changeSearch}
        isFetching={isArticlesFetching}
        title="Health content"
        description="Personalized articles and wellness recommendations."
        onNavigate={(href) => navigate(href)}
      />
    </div>
  )
}

export default MemberOverviewPage
