import { useEffect, useState } from "react"
import { listAssessments, type AssessmentsResponse } from "@workspace/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ClipboardList, ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react"

function getRiskIcon(riskLevel: string | null) {
  if (!riskLevel) return <ClipboardList className="h-6 w-6 text-muted-foreground" />
  const lowerRisk = riskLevel.toLowerCase()
  if (lowerRisk.includes("high")) return <AlertCircle className="h-6 w-6 text-destructive" />
  if (lowerRisk.includes("moderate")) return <AlertTriangle className="h-6 w-6 text-yellow-500" />
  if (lowerRisk.includes("low")) return <CheckCircle2 className="h-6 w-6 text-green-500" />
  return <ShieldAlert className="h-6 w-6 text-muted-foreground" />
}

export function MemberStatusPage() {
  const [assessments, setAssessments] = useState<AssessmentsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const data = await listAssessments()
      setAssessments(data)
      setIsLoading(false)
    }
    void load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Health Status</h2>
        <p className="text-sm text-muted-foreground">
          View your latest health assessment results and risk scores.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : !assessments?.results?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold">No Assessments Found</h3>
            <p className="text-sm text-muted-foreground">
              You haven't completed any health assessments yet. Go to the Forms tab to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assessments.results.map((result) => (
            <Card key={result.score_id} className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{result.score_name}</CardTitle>
                  {getRiskIcon(result.risk_level)}
                </div>
                {result.evaluated_at && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Evaluated on {new Date(result.evaluated_at).toLocaleDateString()}
                  </div>
                )}
                <CardDescription className="flex flex-col gap-1 mt-2">
                  <div>
                    Risk Level: <span className="font-semibold text-foreground">{result.risk_level || "Unknown"}</span>
                  </div>
                  {result.raw_value !== null && result.raw_value !== undefined && (
                    <div>
                      Score: <span className="font-semibold text-foreground">{result.raw_value}</span>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  {result.explanation || "No explanation provided."}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
