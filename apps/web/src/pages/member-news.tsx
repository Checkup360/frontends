import {
  memberNewsArticles,
  NewsCard,
} from "@/components/member/news"

export function MemberNewsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <NewsCard articles={memberNewsArticles} />
    </div>
  )
}
