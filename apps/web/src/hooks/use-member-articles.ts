import { useEffect, useState, useCallback } from "react"
import {
  fetchMemberRiskPriorities,
  fetchRecommendedCmsPages,
  mapPayloadPageToArticle,
  resolveCmsUrl,
  type HealthContentArticle,
} from "@workspace/api"

export interface UseMemberArticlesOptions {
  page?: number
  limit?: number
}

export interface PaginationInfo {
  page: number
  totalPages: number
  totalDocs: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export function useMemberArticles(options?: UseMemberArticlesOptions) {
  const page = options?.page ?? 1
  const limit = options?.limit ?? 10

  const [articles, setArticles] = useState<HealthContentArticle[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page,
    totalPages: 1,
    totalDocs: 0,
    limit,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadArticles = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const cmsOrigin = resolveCmsUrl()

      // 1. Consultar prioridades clínicas de riesgo calculadas por el backend
      const priorities = await fetchMemberRiskPriorities()
      const riskWeights = priorities?.risk_weights

      // 2. Consultar recomendaciones ponderadas y paginadas del CMS
      const response = await fetchRecommendedCmsPages({
        cmsOrigin,
        riskWeights,
        page,
        limit,
      })

      const docs = response.docs || []
      const mapped = docs.map((doc) => mapPayloadPageToArticle(doc, cmsOrigin))

      setArticles(mapped)
      setPagination({
        page: response.page || page,
        totalPages: response.totalPages || 1,
        totalDocs: response.totalDocs || mapped.length,
        limit: response.limit || limit,
        hasNextPage: Boolean(response.hasNextPage),
        hasPrevPage: Boolean(response.hasPrevPage),
      })
    } catch (err) {
      console.error("Error fetching recommended articles from CMS:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load recommended articles"
      )
      setArticles([])
    } finally {
      setIsLoading(false)
    }
  }, [page, limit])

  useEffect(() => {
    // eslint-disable-next-line
    void loadArticles()
  }, [loadArticles])

  return {
    articles,
    pagination,
    isLoading,
    error,
    refetch: loadArticles,
  }
}
