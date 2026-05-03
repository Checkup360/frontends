import { Card } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "destructive";
};

const toneMap = {
  primary: "bg-primary/10 text-primary",
  success: "bg-[color:var(--success)]/10 text-[color:var(--success)]",
  warning: "bg-[color:var(--warning)]/10 text-[color:var(--warning)]",
  destructive: "bg-destructive/10 text-destructive",
};

export function StatCard({ label, value, delta, hint, icon: Icon, tone = "primary" }: StatCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="p-5 border-border/60 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("rounded-xl p-2.5", toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {delta !== undefined && (
        <div className="mt-4 flex items-center gap-1 text-xs font-medium">
          {positive ? (
            <ArrowUpRight className="h-3.5 w-3.5 text-[color:var(--success)]" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
          )}
          <span className={positive ? "text-[color:var(--success)]" : "text-destructive"}>
            {positive ? "+" : ""}
            {delta}%
          </span>
          <span className="text-muted-foreground">vs. last month</span>
        </div>
      )}
    </Card>
  );
}
