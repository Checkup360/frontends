import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ArrowRight, Clock } from "lucide-react"

export interface NewsArticle {
  id: string
  title: string
  category: string
  readTime: number
  image: string
  excerpt: string
}

interface NewsCardProps {
  articles: NewsArticle[]
}

export function NewsCard({ articles }: NewsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Health content</CardTitle>
        <CardDescription>
          Articles and tips for your wellbeing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {articles.map((article) => (
          <article
            key={article.id}
            className="group overflow-hidden rounded-lg border border-border/60 bg-card transition-all hover:border-primary/25 hover:shadow-sm"
          >
            <div className="flex gap-4 p-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                <img
                  src={article.image}
                  alt=""
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {article.category}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {article.readTime} min
                    </span>
                  </div>
                  <h4 className="line-clamp-2 leading-snug font-medium group-hover:text-primary">
                    {article.title}
                  </h4>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {article.excerpt}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Read article
                  <ArrowRight className="size-3" />
                </div>
              </div>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  )
}
