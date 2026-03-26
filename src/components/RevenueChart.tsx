import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { historicalRevenue, formatCurrency } from "@/lib/data";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-card">
      <p className="text-xs font-medium text-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono font-medium text-foreground">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function MRRChart() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-display text-sm font-semibold text-foreground mb-1">MRR Growth</h3>
      <p className="text-xs text-muted-foreground mb-4">Monthly recurring revenue over time</p>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={historicalRevenue}>
          <defs>
            <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(172, 66%, 50%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(172, 66%, 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
          <XAxis dataKey="monthShort" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="mrr" stroke="hsl(172, 66%, 50%)" strokeWidth={2.5} fill="url(#mrrGradient)" name="MRR" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueBreakdownChart() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-display text-sm font-semibold text-foreground mb-1">Revenue Breakdown</h3>
      <p className="text-xs text-muted-foreground mb-4">New, existing, upgrades, and churn by month</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={historicalRevenue.slice(1)}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
          <XAxis dataKey="monthShort" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="new" fill="hsl(172, 66%, 50%)" name="New" radius={[3, 3, 0, 0]} />
          <Bar dataKey="existing" fill="hsl(200, 70%, 55%)" name="Existing" radius={[3, 3, 0, 0]} />
          <Bar dataKey="upgrades" fill="hsl(262, 60%, 58%)" name="Upgrades" radius={[3, 3, 0, 0]} />
          <Bar dataKey="churn" fill="hsl(0, 72%, 55%)" name="Churn" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
