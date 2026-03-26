import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { monthlyMembers, annualMembers, currentSnapshot, formatCurrency } from "@/lib/data";

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-card">
      <p className="text-xs font-medium text-foreground">{data.label}</p>
      <p className="text-xs text-muted-foreground">{data.count} members · {formatCurrency(data.monthlyRevenue)}/mo</p>
    </div>
  );
};

export function MemberComposition() {
  const legacyRev = 387;
  const currentRev = 1934;
  const legacyPct = ((legacyRev / (legacyRev + currentRev)) * 100).toFixed(0);
  const currentPct = ((currentRev / (legacyRev + currentRev)) * 100).toFixed(0);

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-display text-sm font-semibold text-foreground mb-1">Member Composition</h3>
      <p className="text-xs text-muted-foreground mb-4">{currentSnapshot.payingMembers} paying members across all tiers</p>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Monthly pie */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 text-center">Monthly ({currentSnapshot.monthlyPayingMembers})</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={monthlyMembers} cx="50%" cy="50%" outerRadius={60} innerRadius={30} paddingAngle={3} dataKey="count">
                {monthlyMembers.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {monthlyMembers.map((m) => (
              <div key={m.label} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
                <span className="text-muted-foreground truncate">{m.label}</span>
                <span className="font-mono text-foreground ml-auto">{m.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Annual pie */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 text-center">Annual ({currentSnapshot.annualPayingMembers})</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={annualMembers} cx="50%" cy="50%" outerRadius={60} innerRadius={30} paddingAngle={3} dataKey="count">
                {annualMembers.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {annualMembers.map((m) => (
              <div key={m.label} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
                <span className="text-muted-foreground truncate">{m.label}</span>
                <span className="font-mono text-foreground ml-auto">{m.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legacy vs Current */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-xs font-medium text-muted-foreground mb-3">Legacy vs Current Pricing Revenue</p>
        <div className="flex h-3 rounded-full overflow-hidden bg-muted">
          <div className="bg-primary rounded-l-full" style={{ width: `${currentPct}%` }} />
          <div className="bg-accent rounded-r-full" style={{ width: `${legacyPct}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs">
          <span className="text-primary font-medium">{currentPct}% current ({formatCurrency(currentRev)}/mo)</span>
          <span className="text-accent font-medium">{legacyPct}% legacy ({formatCurrency(legacyRev)}/mo)</span>
        </div>
      </div>
    </div>
  );
}
