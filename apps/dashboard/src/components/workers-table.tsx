import { Card } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { useMemo, useState } from "react";

type Worker = {
  name: string;
  area: string;
  score: number;
  risk: "Low" | "Medium" | "High";
  lastCheck: string;
};

const workers: Worker[] = [
  { name: "Lucy Mendez", area: "Operations", score: 88, risk: "Low", lastCheck: "3 days ago" },
  { name: "Carlos Perez", area: "Production", score: 62, risk: "High", lastCheck: "1 week ago" },
  { name: "Mariana Soto", area: "Administration", score: 91, risk: "Low", lastCheck: "2 days ago" },
  { name: "Diego Ramirez", area: "Logistics", score: 71, risk: "Medium", lastCheck: "5 days ago" },
  { name: "Sofia Alvarez", area: "IT", score: 84, risk: "Low", lastCheck: "yesterday" },
  { name: "Javier Torres", area: "Production", score: 58, risk: "High", lastCheck: "2 weeks ago" },
  { name: "Paula Gomez", area: "Sales", score: 76, risk: "Medium", lastCheck: "4 days ago" },
];

const riskClass: Record<Worker["risk"], string> = {
  Low: "bg-[color:var(--success)]/15 text-[color:var(--success)] border-transparent",
  Medium: "bg-[color:var(--warning)]/15 text-[color:var(--warning)] border-transparent",
  High: "bg-destructive/15 text-destructive border-transparent",
};

export function WorkersTable() {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => workers.filter((w) => `${w.name} ${w.area}`.toLowerCase().includes(q.toLowerCase())),
    [q],
  );
  return (
    <Card className="p-6 border-border/60 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Employees</h3>
          <p className="text-sm text-muted-foreground">Individual data and risk level</p>
        </div>
        <input
          type="text"
          placeholder="Search by name or area…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
        />
      </div>
      <div className="overflow-hidden rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Area</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Risk</th>
              <th className="px-4 py-3 font-medium">Last assessment</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <tr key={w.name} className="border-t border-border/60 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{w.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{w.area}</td>
                <td className="px-4 py-3 font-semibold tabular-nums text-foreground">{w.score}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={riskClass[w.risk]}>{w.risk}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{w.lastCheck}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
