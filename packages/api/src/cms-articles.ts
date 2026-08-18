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
  content?: unknown
  diseaseTypes?: string[] | null
  coverImage?: string | number | PayloadMedia | null
  author?: string | number | PayloadAuthorDoc | null
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

export type HealthContentAuthor = {
  name: string
  website?: string
  websiteName?: string
  image?: string
}

export type HealthContentArticle = {
  id: string
  title: string
  category: string
  readTime: number
  image: string
  imageAlt?: string
  excerpt: string
  href?: string
  diseaseTypes?: string[]
  author?: HealthContentAuthor
  pubDate?: Date
  content?: unknown
}

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&auto=format&fit=crop&q=80"

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
    return "Read article for details."
  }
  if (fullText.length <= maxLength) {
    return fullText
  }
  const truncated = fullText.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(" ")
  return (lastSpace > 50 ? truncated.slice(0, lastSpace) : truncated) + "..."
}

/**
 * Calcula el tiempo estimado de lectura en minutos
 */
export function calculateReadTime(content: unknown, wordsPerMinute = 200): number {
  const text = extractTextFromLexical(content)
  if (!text) return 3
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

function formatCategoryName(rawCategory?: string): string {
  if (!rawCategory) return "General"
  return rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase()
}

/**
 * Transforma un documento de página de Payload a un HealthContentArticle plano
 */
export function mapPayloadPageToArticle(
  doc: PayloadPageDoc,
  cmsOrigin = "http://localhost:3000"
): HealthContentArticle {
  const diseaseTypes = doc.diseaseTypes ?? []
  const primaryDisease = diseaseTypes[0]
  const category = formatCategoryName(primaryDisease)

  let imageUrl = DEFAULT_FALLBACK_IMAGE
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

  const pubDate = doc.createdAt ? new Date(doc.createdAt) : new Date()

  return {
    id: String(doc.id),
    title: doc.title,
    category,
    readTime: calculateReadTime(doc.content),
    image: imageUrl,
    imageAlt,
    excerpt: extractExcerptFromLexical(doc.content),
    href: `/news/${doc.id}`,
    diseaseTypes: diseaseTypes.map((t) => t.toLowerCase()),
    author: authorObj,
    pubDate,
    content: doc.content,
  }
}

/**
 * Ordena artículos determinísticamente según la lista de prioridades de salud dada por el backend
 */
export function sortArticlesByTopics(
  articles: HealthContentArticle[],
  priorityTopics: string[] = []
): HealthContentArticle[] {
  if (!priorityTopics || priorityTopics.length === 0) {
    return [...articles]
  }

  const topicIndexMap = new Map<string, number>()
  priorityTopics.forEach((topic, index) => {
    topicIndexMap.set(topic.toLowerCase(), index)
  })

  function getArticlePriorityRank(article: HealthContentArticle): number {
    const types = article.diseaseTypes ?? [article.category.toLowerCase()]
    let highestRank = 9999

    for (const type of types) {
      const rank = topicIndexMap.get(type)
      if (rank !== undefined && rank < highestRank) {
        highestRank = rank
      }
    }

    return highestRank
  }

  return [...articles].sort((a, b) => {
    const rankA = getArticlePriorityRank(a)
    const rankB = getArticlePriorityRank(b)
    return rankA - rankB
  })
}

/**
 * Consulta la API REST de Payload CMS para obtener las páginas/artículos disponibles
 */
export async function fetchCmsPages(options?: {
  cmsOrigin?: string
  limit?: number
}): Promise<PayloadPageDoc[]> {
  const cmsOrigin = (
    options?.cmsOrigin ||
    (typeof window !== "undefined" && (window as unknown as { __CMS_ORIGIN__?: string }).__CMS_ORIGIN__) ||
    "http://localhost:3000"
  ).replace(/\/$/, "")

  const limit = options?.limit ?? 50
  const url = `${cmsOrigin}/api/pages?depth=2&limit=${limit}`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch CMS pages: HTTP ${response.status}`)
  }

  const data = (await response.json()) as PayloadPagesResponse
  return data.docs || []
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
    (typeof window !== "undefined" && (window as unknown as { __CMS_ORIGIN__?: string }).__CMS_ORIGIN__) ||
    "http://localhost:3000"
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
