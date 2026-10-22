import { useEffect, useState, useCallback, useRef } from "react"
import {
  fetchRecommendedCmsPages,
  mapPayloadPageToArticle,
  resolveCmsUrl,
  type CategoryLabels,
  type HealthContentArticle,
} from "@workspace/api"

export interface UseMemberArticlesOptions {
  page?: number
  limit?: number
  category?: string | null
  search?: string
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
  const category = options?.category ?? null
  const search = options?.search ?? ""

  const [articles, setArticles] = useState<HealthContentArticle[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [categoryLabels, setCategoryLabels] = useState<CategoryLabels>({})
  const [pagination, setPagination] = useState<PaginationInfo>({
    page,
    totalPages: 1,
    totalDocs: 0,
    limit,
    hasNextPage: false,
    hasPrevPage: false,
  })
  // isLoading only covers the first load; later filter changes use isFetching
  // so the page keeps its controls mounted while new results arrive.
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const latestRequestId = useRef(0)

  const loadArticles = useCallback(async () => {
    const requestId = ++latestRequestId.current
    setIsFetching(true)
    setError(null)

    try {
      const cmsOrigin = resolveCmsUrl()
      const response = await fetchRecommendedCmsPages({
        cmsOrigin,
        page,
        limit,
        category,
        search,
      })
      if (requestId !== latestRequestId.current) return

      const labels = response.categoryLabels ?? {}
      const mapped = (response.docs || []).map((doc) =>
        mapPayloadPageToArticle(doc, cmsOrigin, labels)
      )
      setArticles(mapped)
      setCategoryLabels(labels)
      setCategories(response.categories ?? [])
      setPagination({
        page: response.page || page,
        totalPages: response.totalPages || 1,
        totalDocs: response.totalDocs || mapped.length,
        limit: response.limit || limit,
        hasNextPage: Boolean(response.hasNextPage),
        hasPrevPage: Boolean(response.hasPrevPage),
      })
    } catch (err) {
      if (requestId !== latestRequestId.current) return
      console.error("Error fetching recommended articles from CMS:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load recommended articles"
      )
      setArticles([])
    } finally {
      if (requestId === latestRequestId.current) {
        setIsLoading(false)
        setIsFetching(false)
      }
    }
  }, [page, limit, category, search])

  useEffect(() => {
    // eslint-disable-next-line
    void loadArticles()
  }, [loadArticles])

  return {
    articles,
    categories,
    categoryLabels,
    pagination,
    isLoading,
    isFetching,
    error,
    refetch: loadArticles,
  }
}
