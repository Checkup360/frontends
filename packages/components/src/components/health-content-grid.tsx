import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { ArrowRight, Clock, Newspaper, Search } from "lucide-react"
import { useMemo, useState } from "react"
import type { HealthContentArticle } from "@workspace/api"

const MAX_VISIBLE_CARD_CATEGORIES = 2
const ALL_CATEGORIES = "All"

function ArticleCategoryBadges({ categories }: { categories: string[] }) {
  const visible = categories.slice(0, MAX_VISIBLE_CARD_CATEGORIES)
  const hidden = categories.slice(MAX_VISIBLE_CARD_CATEGORIES)
  return (
    <div className="flex min-w-0 flex-wrap justify-end gap-1.5">
      {visible.map((category) => (
        <Badge key={category} variant="secondary" className="text-xs">
          {category}
        </Badge>
      ))}
      {hidden.length > 0 && (
        <Badge
          variant="outline"
          className="text-xs"
          title={hidden.join(", ")}
          aria-label={`${hidden.length} more categories: ${hidden.join(", ")}`}
        >
          +{hidden.length}
        </Badge>
      )}
    </div>
  )
}

type HealthContentGridProps = {
  articles: HealthContentArticle[]
  title?: string
  description?: string
  onNavigate?: (href: string) => void
}

function ArticleCard({
  article,
  onNavigate,
}: {
  article: HealthContentArticle
  onNavigate?: (href: string) => void
}) {
  const targetHref = article.href || `/news/${article.id}`

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onNavigate) {
      e.preventDefault()
      onNavigate(targetHref)
    }
  }

  return (
    <Card className="group h-full gap-0 p-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden flex flex-col rounded-2xl border-border/60">
      <a
        href={targetHref}
        onClick={handleClick}
        className="block overflow-hidden bg-muted aspect-video w-full focus:outline-none relative"
        tabIndex={-1}
      >
        {article.image ? (
          <img
            src={article.image}
            alt={article.imageAlt ?? article.title}
            className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-muted/80 text-primary/40">
            <Newspaper className="size-10" />
          </div>
        )}
      </a>
      <CardContent className="flex flex-1 flex-col space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          {article.readTime ? (
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {article.readTime} min read
            </span>
          ) : (
            <span />
          )}
          {article.categories.length > 0 && (
            <ArticleCategoryBadges categories={article.categories} />
          )}
        </div>
        <div className="space-y-1.5">
          <h3 className="line-clamp-2 text-base leading-snug font-semibold text-foreground group-hover:text-primary transition-colors">
            <a
              href={targetHref}
              onClick={handleClick}
              className="focus:outline-none focus:underline"
            >
              {article.title}
            </a>
          </h3>
          {article.excerpt && (
            <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
              {article.excerpt}
            </p>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          {article.author ? (
            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
              By {article.author.name}
            </span>
          ) : (
            <span />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 px-2 text-xs text-primary font-medium"
            asChild
          >
            <a
              href={targetHref}
              onClick={handleClick}
              aria-label={`Read ${article.title}`}
            >
              Read article
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function HealthContentGrid({
  articles,
  title = "Health content",
  description = "Articles and practical tips for your wellbeing.",
  onNavigate,
}: HealthContentGridProps) {
  const [category, setCategory] = useState(ALL_CATEGORIES)
  const [search, setSearch] = useState("")
  const categories = useMemo(
    () => [
      ALL_CATEGORIES,
      ...new Set(articles.flatMap((article) => article.categories)),
    ],
    [articles]
  )
  const visibleArticles = useMemo(() => {
    const query = search.trim().toLowerCase()
    return articles.filter((article) => {
      const matchesCategory =
        category === ALL_CATEGORIES || article.categories.includes(category)
      const matchesSearch =
        !query ||
        article.title.toLowerCase().includes(query) ||
        (article.excerpt && article.excerpt.toLowerCase().includes(query))
      return matchesCategory && matchesSearch
    })
  }, [articles, category, search])

  return (
    <section
      className="mx-auto w-full max-w-7xl space-y-8"
      aria-labelledby="health-content-title"
    >
      <header className="space-y-1">
        <h2
          id="health-content-title"
          className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>

      <Tabs value={category} onValueChange={setCategory} className="gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger
              className="w-full sm:hidden"
              aria-label="Filter by category"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((item) => (
                <SelectItem key={item} value={item}>
                  {item === ALL_CATEGORIES ? "All categories" : item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="hidden min-w-0 overflow-x-auto pb-1 sm:block sm:flex-1">
            <TabsList className="w-max justify-start">
              {categories.map((item) => (
                <TabsTrigger key={item} value={item} className="flex-none">
                  {item}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="relative w-full sm:w-72 sm:shrink-0">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search health content"
              aria-label="Search health content"
              className="pl-9"
            />
          </div>
        </div>
      </Tabs>

      {visibleArticles.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No health content matches your search.
        </p>
      )}
    </section>
  )
}
