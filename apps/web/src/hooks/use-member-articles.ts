import { useEffect, useState, useCallback } from "react"
import {
  fetchMemberProfile,
  fetchCmsPages,
  mapPayloadPageToArticle,
  sortArticlesByTopics,
  resolveCmsUrl,
  type HealthContentArticle,
} from "@workspace/api"

export function useMemberArticles() {
  const [articles, setArticles] = useState<HealthContentArticle[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadArticles = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const cmsOrigin = resolveCmsUrl()

      // Consultar perfil (para prioridades) y páginas de CMS en paralelo
      const [profileResult, docsResult] = await Promise.allSettled([
        fetchMemberProfile(),
        fetchCmsPages({ cmsOrigin }),
      ])

      const priorityTopics =
        profileResult.status === "fulfilled"
          ? (profileResult.value?.priority_topics ?? [])
          : []

      if (docsResult.status === "fulfilled") {
        const docs = docsResult.value || []
        const mapped = docs.map((doc) =>
          mapPayloadPageToArticle(doc, cmsOrigin)
        )
        const sorted = sortArticlesByTopics(mapped, priorityTopics)
        setArticles(sorted)
      } else {
        const fetchError = docsResult.reason
        console.error("Error fetching articles from CMS:", fetchError)
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load articles from CMS"
        )
        setArticles([])
      }
    } catch (err) {
      console.error("Unexpected error in useMemberArticles:", err)
      setError(err instanceof Error ? err.message : "Unexpected error")
      setArticles([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line
    void loadArticles()
  }, [loadArticles])

  return {
    articles,
    isLoading,
    error,
    refetch: loadArticles,
  }
}
