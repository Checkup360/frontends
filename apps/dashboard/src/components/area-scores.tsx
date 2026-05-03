import { Card } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";

const areas = [
  { name: "Operations", score: 82, workers: 124 },
  { name: "Production", score: 67, workers: 210 },
  { name: "Logistics", score: 74, workers: 88 },
  { name: "Administration", score: 89, workers: 56 },
  { name: "Sales", score: 71, workers: 42 },
  { name: "IT", score: 85, workers: 31 },
];

const toneFor = (score: number) => {
  if (score >= 80) return { label: "Healthy", className: "bg-[color:var(--success)]/15 text-[color:var(--success)] border-transparent" };
  if (score >= 70) return { label: "Monitor", className: "bg-[color:var(--warning)]/15 text-[color:var(--warning)] border-transparent" };
  return { label: "Risk", className: "bg-destructive/15 text-destructive border-transparent" };
};

export function AreaScores() {
  return (
    <Card className="p-6 border-border/60 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Score by area</h3>
          <p className="text-sm text-muted-foreground">Aggregated health indicator by department</p>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {areas.map((a) => {
          const tone = toneFor(a.score);
          return (
            <div key={a.name}>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-foreground">{a.name}</span>
                  <Badge variant="outline" className={tone.className}>{tone.label}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{a.workers} employees</span>
                  <span className="font-semibold tabular-nums text-foreground">{a.score}</span>
                </div>
              </div>
              <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${a.score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
