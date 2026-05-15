import {
  memberNewsArticles,
  NewsCard,
} from "@/components/member-overview"

export function MemberNewsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <NewsCard articles={memberNewsArticles} />
    </div>
  )
}
