import { memberNewsArticles } from "@/components/member/news"
import { HealthContentGrid } from "@workspace/components/components/health-content-grid"

export function MemberNewsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <HealthContentGrid articles={memberNewsArticles} />
    </div>
  )
}
