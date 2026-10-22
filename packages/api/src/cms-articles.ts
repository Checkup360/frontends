export type PayloadMedia = {
  id: string | number
  url?: string
  alt?: string
  filename?: string
  mimeType?: string
  filesize?: number
  width?: number
  height?: number
}

export type PayloadAuthorDoc = {
  id: string | number
  name: string
  image?: string | number | PayloadMedia | null
  website?: string | null
  websiteName?: string | null
  organization?: string | null
  createdAt?: string
  updatedAt?: string
}

export type PayloadPageDoc = {
  id: string | number
  title: string
  summary?: string | null
  content?: unknown
  diseaseTypes?: string[] | null
  coverImage?: string | number | PayloadMedia | null
  author?: string | number | PayloadAuthorDoc | null
  publishedAt?: string | null
  readTime?: number | null
  organization?: string | null
  createdAt?: string
  updatedAt?: string
}

export type PayloadPagesResponse = {
  docs: PayloadPageDoc[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

export type RecommendedCmsPagesResponse = PayloadPagesResponse & {
  /** Raw category keys of every article in the organization. */
  categories?: string[]
  categoryLabels?: Record<string, string>
  personalized?: boolean
}

export type HealthContentAuthor = {
  name: string
  website?: string
  websiteName?: string
  image?: string
}

export type HealthContentArticle = {
  id: string
  title: string
  /** Readable labels of every CMS category, in CMS order. */
  categories: string[]
  readTime?: number
  image?: string
  imageAlt?: string
  excerpt: string
  href?: string
  diseaseTypes?: string[]
  author?: HealthContentAuthor
  pubDate?: Date
  content?: unknown
}

import { resolveCmsUrl } from "./client"

/**
 * Extrae texto plano de la estructura JSON AST de Lexical RichText
 */
export function extractTextFromLexical(content: unknown): string {
  if (!content || typeof content !== "object") return ""

  const texts: string[] = []

  function walk(node: unknown) {
    if (!node || typeof node !== "object") return

    if ("text" in node && typeof (node as { text: unknown }).text === "string") {
      texts.push((node as { text: string }).text)
    }

    if ("children" in node && Array.isArray((node as { children: unknown[] }).children)) {
      for (const child of (node as { children: unknown[] }).children) {
        walk(child)
      }
    }
  }

  const root = "root" in content ? (content as { root: unknown }).root : content
  walk(root)

  return texts.join(" ").replace(/\s+/g, " ").trim()
}

/**
 * Genera un resumen (excerpt) limpio a partir del contenido de Lexical
 */
export function extractExcerptFromLexical(
  content: unknown,
  maxLength = 160
): string {
  const fullText = extractTextFromLexical(content)
  if (!fullText) {
    return ""
  }
  if (fullText.length <= maxLength) {
    return fullText
  }
  const truncated = fullText.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(" ")
  return (lastSpace > 50 ? truncated.slice(0, lastSpace) : truncated) + "..."
}

/**
 * Calcula el tiempo estimado de lectura en minutos a partir del texto real.
 * Si no hay contenido, devuelve undefined (sin valor hardcodeado).
 */
export function calculateReadTime(content: unknown, wordsPerMinute = 200): number | undefined {
  const text = extractTextFromLexical(content)
  if (!text) return undefined
  const words = text.split(/\s+/).filter(Boolean).length
  if (words === 0) return undefined
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

const DEFAULT_CATEGORY_LABEL = "General Health"
const GENERAL_CATEGORY_KEY = "general"

/** Readable names of health topics by key, provided by the backend catalog. */
export type CategoryLabels = Record<string, string>

export function toCategoryLabels(
  categories?: Array<{ key: string; label: string }>
): CategoryLabels {
  return Object.fromEntries(
    (categories ?? []).map((category) => [category.key, category.label])
  )
}

export function formatCategoryName(
  rawCategory?: string,
  labels: CategoryLabels = {}
): string {
  if (!rawCategory) return DEFAULT_CATEGORY_LABEL
  const key = rawCategory.toLowerCase()
  if (key === GENERAL_CATEGORY_KEY) return DEFAULT_CATEGORY_LABEL
  const knownLabel = labels[key]
  if (knownLabel) return knownLabel
  const readable = key.replace(/[_-]+/g, " ").trim()
  return readable.charAt(0).toUpperCase() + readable.slice(1)
}

/**
 * Transforma un documento de página de Payload a un HealthContentArticle plano
 */
export function mapPayloadPageToArticle(
  doc: PayloadPageDoc,
  cmsOrigin = "http://localhost:3000",
  categoryLabels: CategoryLabels = {}
): HealthContentArticle {
  const diseaseTypes = doc.diseaseTypes ?? []
  const categories =
    diseaseTypes.length > 0
      ? [
          ...new Set(
            diseaseTypes.map((type) => formatCategoryName(type, categoryLabels))
          ),
        ]
      : [DEFAULT_CATEGORY_LABEL]

  let imageUrl: string | undefined = undefined
  let imageAlt = doc.title

  if (doc.coverImage && typeof doc.coverImage === "object") {
    const media = doc.coverImage as PayloadMedia
    if (media.url) {
      imageUrl = media.url.startsWith("http")
        ? media.url
        : `${cmsOrigin.replace(/\/$/, "")}${media.url.startsWith("/") ? "" : "/"}${media.url}`
    }
    if (media.alt) {
      imageAlt = media.alt
    }
  }

  let authorObj: HealthContentAuthor | undefined = undefined
  if (doc.author && typeof doc.author === "object") {
    const authorDoc = doc.author as PayloadAuthorDoc
    let authorImageUrl: string | undefined = undefined

    if (authorDoc.image && typeof authorDoc.image === "object") {
      const authorMedia = authorDoc.image as PayloadMedia
      if (authorMedia.url) {
        authorImageUrl = authorMedia.url.startsWith("http")
          ? authorMedia.url
          : `${cmsOrigin.replace(/\/$/, "")}${authorMedia.url.startsWith("/") ? "" : "/"}${authorMedia.url}`
      }
    }

    authorObj = {
      name: authorDoc.name,
      website: authorDoc.website ?? undefined,
      websiteName: authorDoc.websiteName ?? undefined,
      image: authorImageUrl,
    }
  }

  const explicitReadTime =
    doc.readTime !== null && doc.readTime !== undefined ? Number(doc.readTime) : undefined
  const finalReadTime = explicitReadTime ?? calculateReadTime(doc.content)

  const rawExcerpt = doc.summary?.trim() || extractExcerptFromLexical(doc.content)
  const excerpt = rawExcerpt || ""

  const pubDate = doc.publishedAt
    ? new Date(doc.publishedAt)
    : doc.createdAt
      ? new Date(doc.createdAt)
      : undefined

  return {
    id: String(doc.id),
    title: doc.title,
    categories,
    readTime: finalReadTime,
    image: imageUrl,
    imageAlt,
    excerpt,
    href: `/news/${doc.id}`,
    diseaseTypes: diseaseTypes.map((t) => t.toLowerCase()),
    author: authorObj,
    pubDate,
    content: doc.content,
  }
}

/**
 * Consulta un artículo/página individual por su ID desde Payload CMS
 */
export async function fetchCmsPageById(
  id: string | number,
  options?: { cmsOrigin?: string }
): Promise<PayloadPageDoc | null> {
  const cmsOrigin = (
    options?.cmsOrigin ||
    resolveCmsUrl()
  ).replace(/\/$/, "")

  const url = `${cmsOrigin}/api/pages/${id}?depth=2`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch CMS page ${id}: HTTP ${response.status}`)
  }

  const data = (await response.json()) as PayloadPageDoc
  return data
}

/**
 * Consulta la API recomendada del CMS con priorización por riesgos y decaimiento temporal
 */
export async function fetchRecommendedCmsPages(options?: {
  cmsOrigin?: string
  page?: number
  limit?: number
  category?: string | null
  search?: string
}): Promise<RecommendedCmsPagesResponse> {
  const cmsOrigin = (
    options?.cmsOrigin ||
    resolveCmsUrl()
  ).replace(/\/$/, "")

  const page = Math.max(1, options?.page ?? 1)
  const limit = Math.max(1, options?.limit ?? 10)
  const params = new URLSearchParams()
  params.append("page", page.toString())
  params.append("limit", limit.toString())

  if (options?.category) {
    params.append("category", options.category)
  }
  const search = options?.search?.trim()
  if (search) {
    params.append("search", search)
  }

  const url = `${cmsOrigin}/api/pages/recommended?${params.toString()}`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch recommended CMS pages: HTTP ${response.status}`)
  }

  return (await response.json()) as RecommendedCmsPagesResponse
}
