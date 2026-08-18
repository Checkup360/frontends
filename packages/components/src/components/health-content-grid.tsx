import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { ArrowRight, Clock, Search } from "lucide-react"
import { useMemo, useState } from "react"
import type { HealthContentArticle } from "@workspace/api"

type HealthContentGridProps = {
  articles: HealthContentArticle[]
  title?: string
  description?: string
}

function ArticleCard({ article }: { article: HealthContentArticle }) {
  const targetHref = article.href || `/news/${article.id}`

  return (
    <Card className="group h-full gap-0 p-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden flex flex-col">
      {article.image && (
        <a
          href={targetHref}
          className="block overflow-hidden bg-muted aspect-video w-full focus:outline-none"
          tabIndex={-1}
        >
          <img
            src={article.image}
            alt={article.imageAlt ?? article.title}
            className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </a>
      )}
      <CardContent className="flex flex-1 flex-col space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          {article.readTime ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {article.readTime} min read
            </span>
          ) : (
            <span />
          )}
          {article.category && <Badge variant="secondary">{article.category}</Badge>}
        </div>
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-base leading-snug font-semibold text-foreground group-hover:text-primary transition-colors">
            <a href={targetHref} className="focus:outline-none focus:underline">
              {article.title}
            </a>
          </h3>
          {article.excerpt && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
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
          <Button variant="ghost" size="sm" className="gap-1 px-2 text-xs text-primary font-medium" asChild>
            <a href={targetHref} aria-label={`Read ${article.title}`}>
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
}: HealthContentGridProps) {
  const [category, setCategory] = useState("All")
  const [search, setSearch] = useState("")
  const categories = useMemo(
    () => ["All", ...new Set(articles.map((article) => article.category).filter(Boolean))],
    [articles]
  )
  const visibleArticles = useMemo(() => {
    const query = search.trim().toLowerCase()
    return articles.filter((article) => {
      const matchesCategory =
        category === "All" || article.category === category
      const matchesSearch =
        !query ||
        article.title.toLowerCase().includes(query) ||
        (article.excerpt && article.excerpt.toLowerCase().includes(query))
      return matchesCategory && matchesSearch
    })
  }, [articles, category, search])

  return (
    <section className="space-y-8" aria-labelledby="health-content-title">
      <header className="max-w-3xl space-y-2">
        <h2
          id="health-content-title"
          className="text-2xl font-semibold tracking-tight"
        >
          {title}
        </h2>
        <p className="text-muted-foreground">{description}</p>
      </header>

      <Tabs value={category} onValueChange={setCategory} className="gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:w-auto">
            <TabsList className="h-auto flex-wrap justify-start">
              {categories.map((item) => (
                <TabsTrigger key={item} value={item}>
                  {item}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="relative w-full sm:max-w-xs">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
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
