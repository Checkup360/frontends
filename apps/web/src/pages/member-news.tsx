import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card"
import { Newspaper } from "lucide-react"

export function MemberNewsPage() {
  const news = [
    {
      id: 1,
      title: "New Wellness Program Launches",
      description:
        "Join our comprehensive wellness initiative with fitness tracking and mental health support.",
      date: "2 days ago",
      category: "Announcement",
    },
    {
      id: 2,
      title: "Q2 Health Survey Results",
      description:
        "Check out the latest survey results and insights from your organization.",
      date: "1 week ago",
      category: "Update",
    },
    {
      id: 3,
      title: "Open Enrollment Reminder",
      description:
        "Don't forget to complete your health benefits enrollment by the end of this month.",
      date: "2 weeks ago",
      category: "Reminder",
    },
  ]

  return (
    <div className="space-y-4">
      {news.length > 0 ? (
        news.map((item) => (
          <Card
            key={item.id}
            className="cursor-pointer transition-colors hover:bg-muted/30"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Newspaper className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="inline-block rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {item.category}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {item.description}
                  </CardDescription>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{item.date}</p>
            </CardHeader>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Newspaper className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No news yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
