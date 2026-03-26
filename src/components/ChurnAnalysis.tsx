import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { historicalChurn, currentSnapshot, formatPercent } from "@/lib/data";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-card">
      <p className="text-xs font-medium text-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono font-medium text-foreground">{formatPercent(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function ChurnChart() {
  const data = historicalChurn.slice(2); // skip launch months

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display text-sm font-semibold text-foreground">Revenue Churn Rate</h3>
        <span className="text-xs font-mono text-destructive font-medium">{formatPercent(currentSnapshot.avgChurnRate)} avg</span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Target: <span className="text-success font-medium">{formatPercent(currentSnapshot.targetChurnRate)}</span>
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
          <XAxis dataKey="month" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 20]} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={currentSnapshot.targetChurnRate} stroke="hsl(152, 60%, 45%)" strokeDasharray="5 5" label={{ value: "Target 8%", fill: "hsl(152, 60%, 45%)", fontSize: 10, position: "right" }} />
          <Line type="monotone" dataKey="revenueChurnRate" stroke="hsl(0, 72%, 55%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(0, 72%, 55%)" }} name="Revenue Churn" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
