import { useMemo } from "react"
import type { RiskTrendPoint } from "@workspace/api"
import { buildTrendsTimelineWithForwardFill } from "@workspace/components/components/assessment-utils"
import { ScoreEvolutionChart } from "@workspace/components/components/score-evolution-chart"

interface RiskTrendProps {
  trends?: RiskTrendPoint[]
  loading?: boolean
}

export function RiskTrend({ trends, loading }: RiskTrendProps) {
  const chartData = useMemo(() => {
    if (!trends || trends.length === 0) return []
    const filled = buildTrendsTimelineWithForwardFill(trends)
    return filled.map((t) => ({
      month: t.month,
      period: t.period,
      overall: typeof t.average_score === "number" ? Math.round(t.average_score) : null,
      _isCarried: t._isCarried,
    }))
  }, [trends])

  return (
    <ScoreEvolutionChart
      title="Health score trends"
      description="Monthly evolution of the aggregated health index (higher is healthier)"
      data={chartData}
      series={[
        {
          key: "overall",
          label: "Health index",
          color: "oklch(0.65 0.18 250)",
          strokeWidth: 2,
        },
      ]}
      yAxisDomain={[0, 100]}
      yAxisTicks={[0, 25, 50, 75, 100]}
      showPercentages={true}
      showDots={true}
      loading={loading}
      height={264}
      emptyTitle="No trend data yet"
      emptyMessage="Health score trends will appear here as members complete evaluations."
      className="border-border/60 shadow-[var(--shadow-card)]"
    />
  )
}
