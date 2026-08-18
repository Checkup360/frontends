import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, RefreshCw } from "lucide-react"

import { Blogpost1 } from "@workspace/components/components/blog-post"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { useMemberArticleDetail } from "@/hooks/use-member-article-detail"

export function MemberNewsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { article, isLoading, error, refetch } = useMemberArticleDetail(id)

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate("/news")
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-8 py-12 px-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        <div className="mx-auto flex flex-col items-center gap-4 text-center">
          <Skeleton className="h-12 w-3/4 max-w-2xl rounded-xl" />
          <Skeleton className="h-6 w-1/2 max-w-lg rounded-md" />
          
          <div className="flex items-center gap-3 mt-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-4 w-28 rounded-md" />
          </div>

          <Skeleton className="mt-4 aspect-video w-full rounded-xl" />
        </div>

        <div className="mx-auto max-w-2xl space-y-4 pt-4">
          <Skeleton className="h-6 w-1/3 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-5/6 rounded-md" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-4/5 rounded-md" />
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="mx-auto w-full max-w-2xl py-20 px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Article Not Found</AlertTitle>
          <AlertDescription>
            {error || "The health article you are looking for could not be loaded."}
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ArrowLeft className="size-4" />
            Back to News
          </Button>
          <Button variant="ghost" onClick={() => void refetch()} className="gap-2">
            <RefreshCw className="size-4" />
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <Blogpost1
        title={article.title}
        description={article.excerpt}
        image={article.image}
        pubDate={article.pubDate}
        category={article.category}
        readTime={article.readTime}
        author={article.author}
        content={article.content}
        onBack={handleBack}
      />
    </div>
  )
}

export default MemberNewsDetailPage
