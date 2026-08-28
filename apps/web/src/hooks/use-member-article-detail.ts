import { useEffect, useState, useCallback } from "react"
import {
  fetchCmsPageById,
  mapPayloadPageToArticle,
  resolveCmsUrl,
  type HealthContentArticle,
} from "@workspace/api"

export function useMemberArticleDetail(articleId: string | undefined) {
  const [article, setArticle] = useState<HealthContentArticle | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadArticle = useCallback(async () => {
    if (!articleId) {
      setIsLoading(false)
      setError("No article ID provided")
      setArticle(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const cmsOrigin = resolveCmsUrl()

      const doc = await fetchCmsPageById(articleId, { cmsOrigin })

      if (!doc) {
        setError("Article not found")
        setArticle(null)
      } else {
        const mapped = mapPayloadPageToArticle(doc, cmsOrigin)
        setArticle(mapped)
      }
    } catch (err) {
      console.error("Error loading article detail:", err)
      setError(err instanceof Error ? err.message : "Failed to load article")
      setArticle(null)
    } finally {
      setIsLoading(false)
    }
  }, [articleId])

  useEffect(() => {
    // eslint-disable-next-line
    void loadArticle()
  }, [loadArticle])

  return {
    article,
    isLoading,
    error,
    refetch: loadArticle,
  }
}
