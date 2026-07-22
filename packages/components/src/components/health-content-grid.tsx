import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { ArrowRight, Clock, Search } from "lucide-react"
import { useMemo, useState } from "react"

export type HealthContentArticle = {
  id: string
  title: string
  category: string
  readTime: number
  image: string
  imageAlt?: string
  excerpt: string
  href?: string
}

type HealthContentGridProps = {
  articles: HealthContentArticle[]
  title?: string
  description?: string
}

function ArticleCard({ article }: { article: HealthContentArticle }) {
  return (
    <Card className="group h-full gap-0 p-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="overflow-hidden rounded-t-xl bg-muted">
        <img
          src={article.image}
          alt={article.imageAlt ?? ""}
          className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <CardContent className="flex flex-1 flex-col space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {article.readTime} min read
          </span>
          <Badge variant="secondary">{article.category}</Badge>
        </div>
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-base leading-snug font-medium">
            {article.title}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {article.excerpt}
          </p>
        </div>
        {article.href && (
          <div className="mt-auto flex justify-end pt-1">
            <Button variant="outline" size="icon" asChild>
              <a href={article.href} aria-label={`Read ${article.title}`}>
                <ArrowRight className="-rotate-45" />
              </a>
            </Button>
          </div>
        )}
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
    () => ["All", ...new Set(articles.map((article) => article.category))],
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
        article.excerpt.toLowerCase().includes(query)
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
