import { format } from "date-fns"
import { ArrowLeft, Clock, Share2 } from "lucide-react"
import React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export interface BlogpostAuthor {
  name: string
  website?: string
  websiteName?: string
  image?: string
}

export interface Blogpost1Props {
  className?: string
  title?: string
  author?: BlogpostAuthor
  image?: string
  pubDate?: Date
  description?: string
  content?: unknown
  category?: string
  readTime?: number
  onBack?: () => void
  backUrl?: string
}

/**
 * Format bitmask flags for Lexical text nodes:
 * 1: Bold, 2: Italic, 4: Strikethrough, 8: Underline, 16: Code, 32: Subscript, 64: Superscript
 */
const IS_BOLD = 1
const IS_ITALIC = 1 << 1
const IS_STRIKETHROUGH = 1 << 2
const IS_UNDERLINE = 1 << 3
const IS_CODE = 1 << 4

function LexicalTextNode({ node }: { node: { text: string; format?: number } }) {
  let content: React.ReactNode = node.text
  const f = node.format ?? 0

  if (f & IS_CODE) {
    content = <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{content}</code>
  }
  if (f & IS_BOLD) {
    content = <strong>{content}</strong>
  }
  if (f & IS_ITALIC) {
    content = <em>{content}</em>
  }
  if (f & IS_UNDERLINE) {
    content = <u>{content}</u>
  }
  if (f & IS_STRIKETHROUGH) {
    content = <del>{content}</del>
  }

  return <>{content}</>
}

function LexicalNodeRenderer({ node }: { node: any }): React.ReactNode {
  if (!node) return null

  if (node.type === "text") {
    return <LexicalTextNode node={node} />
  }

  const children = Array.isArray(node.children)
    ? node.children.map((child: any, index: number) => (
        <LexicalNodeRenderer key={child.id || index} node={child} />
      ))
    : null

  switch (node.type) {
    case "heading": {
      const Tag: React.ElementType = (node.tag || "h2")
      const headingClass =
        node.tag === "h1"
          ? "text-3xl font-extrabold tracking-tight mt-10 mb-4"
          : node.tag === "h2"
            ? "text-2xl font-bold tracking-tight mt-8 mb-3"
            : node.tag === "h3"
              ? "text-xl font-semibold tracking-tight mt-6 mb-2"
              : "text-lg font-semibold mt-4 mb-2"
      return <Tag className={headingClass}>{children}</Tag>
    }

    case "paragraph":
      return <p className="mt-3 leading-relaxed text-foreground/90">{children}</p>

    case "quote":
    case "blockquote":
      return (
        <blockquote className="my-6 border-l-4 border-primary/60 pl-4 italic text-muted-foreground">
          {children}
        </blockquote>
      )

    case "list": {
      if (node.listType === "number") {
        return <ol className="my-4 list-decimal space-y-1.5 pl-6">{children}</ol>
      }
      if (node.listType === "check") {
        return <ul className="my-4 space-y-1.5 pl-2">{children}</ul>
      }
      return <ul className="my-4 list-disc space-y-1.5 pl-6">{children}</ul>
    }

    case "listitem": {
      if (node.checked !== undefined) {
        return (
          <li className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(node.checked)}
              readOnly
              className="size-4 rounded border-border text-primary pointer-events-none"
            />
            <span>{children}</span>
          </li>
        )
      }
      return <li className="leading-relaxed">{children}</li>
    }

    case "link":
    case "autolink": {
      const url = node.fields?.url || node.url || "#"
      const newTab = node.fields?.newTab ?? false
      return (
        <a
          href={url}
          target={newTab ? "_blank" : undefined}
          rel={newTab ? "noopener noreferrer" : undefined}
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
        >
          {children}
        </a>
      )
    }

    case "horizontalrule":
      return <hr className="my-8 border-border" />

    case "upload": {
      const value = node.value
      const imgUrl = typeof value === "object" ? value?.url : undefined
      const alt = typeof value === "object" ? value?.alt : "Article media"
      if (!imgUrl) return null
      return (
        <div className="my-8 overflow-hidden rounded-xl border border-border shadow-sm">
          <img src={imgUrl} alt={alt || "Media"} className="aspect-video w-full object-cover" />
          {alt && <p className="px-4 py-2 text-center text-xs text-muted-foreground">{alt}</p>}
        </div>
      )
    }

    default:
      return children ? <>{children}</> : null
  }
}

function LexicalContentRenderer({ content }: { content: unknown }) {
  if (!content || typeof content !== "object") return null

  const root = "root" in content ? (content as { root: any }).root : content
  if (!root || !Array.isArray(root.children) || root.children.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {root.children.map((node: any, index: number) => (
        <LexicalNodeRenderer key={node.id || index} node={node} />
      ))}
    </div>
  )
}

export const Blogpost1 = ({
  className,
  title,
  author,
  image,
  pubDate,
  description,
  content,
  category,
  readTime,
  onBack,
  backUrl,
}: Blogpost1Props) => {
  const hasLexicalContent = Boolean(
    content &&
      typeof content === "object" &&
      ("root" in content
        ? (content as { root?: { children?: unknown[] } }).root?.children?.length
        : false)
  )

  const hasAuthor = Boolean(author && author.name)

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: title || "Health Article",
          text: description,
          url: window.location.href,
        })
      } catch {
        // Ignored if cancelled
      }
    }
  }

  return (
    <section className={cn("py-2 sm:py-4 md:py-6 pb-12", className)}>
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Navigation & Action Bar */}
        <div className="mb-8 flex items-center justify-between">
          {onBack || backUrl ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
              onClick={onBack}
              asChild={Boolean(backUrl && !onBack)}
            >
              {backUrl && !onBack ? (
                <a href={backUrl}>
                  <ArrowLeft className="size-4" />
                  <span>Back to Articles</span>
                </a>
              ) : (
                <>
                  <ArrowLeft className="size-4" />
                  <span>Back to Articles</span>
                </>
              )}
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {category && (
              <Badge variant="secondary" className="capitalize">
                {category}
              </Badge>
            )}
            {readTime && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                {readTime} min read
              </span>
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleShare}
              title="Share article"
              aria-label="Share article"
            >
              <Share2 className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Hero & Meta */}
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          {title && (
            <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-pretty sm:text-4xl md:text-5xl lg:text-6xl">
              {title}
            </h1>
          )}
          {description && (
            <h3 className="max-w-3xl text-base text-muted-foreground sm:text-lg md:text-xl leading-relaxed">
              {description}
            </h3>
          )}
          {(hasAuthor || pubDate) && (
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm md:text-base">
              {hasAuthor && author && (
                <>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border border-border">
                      {author.image && <AvatarImage src={author.image} alt={author.name} />}
                      <AvatarFallback>{author.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-foreground">{author.name}</span>
                  </div>
                  {author.website && (
                    <>
                      <span className="text-muted-foreground hidden sm:inline">•</span>
                      <span className="text-muted-foreground">
                        {author.websiteName ? "from " : ""}
                        <a
                          href={author.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-foreground hover:underline"
                        >
                          {author.websiteName || author.website}
                        </a>
                      </span>
                    </>
                  )}
                </>
              )}
              {pubDate && (
                <>
                  {hasAuthor && <span className="text-muted-foreground hidden sm:inline">•</span>}
                  <span className="text-muted-foreground">
                    Published on {format(pubDate instanceof Date ? pubDate : new Date(pubDate), "MMMM d, yyyy")}
                  </span>
                </>
              )}
            </div>
          )}
          {image && (
            <div className="mt-4 mb-8 aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
              <img
                src={image}
                alt={title || "Cover image"}
                className="size-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Body Content */}
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary prose-img:rounded-xl">
          {hasLexicalContent ? (
            <LexicalContentRenderer content={content} />
          ) : (
            <p className="text-muted-foreground italic text-center py-8">
              No content available for this article.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default Blogpost1
