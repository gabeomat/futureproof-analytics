import { formatCurrency } from "@/lib/data";
import { useLiveMetrics } from "@/hooks/useLiveMetrics";

export function DualMRRView() {
  const currentSnapshot = useLiveMetrics();
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-display text-lg font-semibold text-foreground mb-1">MRR Comparison</h3>
      <p className="text-sm text-muted-foreground mb-5">Skool's definition vs G's pure monthly MRR</p>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Skool's MRR */}
        <div className="rounded-lg border border-border bg-secondary/30 p-5">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3">Skool MRR</p>
          <p className="font-display text-4xl font-bold text-foreground">{formatCurrency(currentSnapshot.skoolMRR)}</p>
          <p className="text-sm text-muted-foreground mt-2">Includes annualized annual revenue</p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ARPU</span>
              <span className="font-mono text-foreground">{formatCurrency(currentSnapshot.skoolARPU)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">LTV</span>
              <span className="font-mono text-foreground">{formatCurrency(currentSnapshot.skoolLTV)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Retention</span>
              <span className="font-mono text-foreground">93%</span>
            </div>
          </div>
        </div>

        {/* G's MRR */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 shadow-glow">
          <p className="text-sm font-medium uppercase tracking-wider text-primary mb-3">Pure Monthly MRR</p>
          <p className="font-display text-4xl font-bold text-primary">{formatCurrency(currentSnapshot.pureMonthlyMRR)}</p>
          <p className="text-sm text-muted-foreground mt-2">Monthly subscriptions only</p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly ARPU</span>
              <span className="font-mono text-foreground">{formatCurrency(Math.round(currentSnapshot.pureMonthlyMRR / currentSnapshot.monthlyPayingMembers))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Calculated LTV</span>
              <span className="font-mono text-foreground">{formatCurrency(currentSnapshot.calculatedLTV)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Actual Churn</span>
              <span className="font-mono text-destructive">~13.5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Annual revenue callout */}
      <div className="mt-4 rounded-lg border border-warning/20 bg-warning/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-warning">Annual Cash Not in MRR</p>
            <p className="text-sm text-muted-foreground mt-1">{currentSnapshot.annualPayingMembers} annual members × avg $27.75/mo annualized</p>
          </div>
          <p className="font-display text-xl font-bold text-warning">{formatCurrency(Math.round(currentSnapshot.annualizedContribution))}/mo</p>
        </div>
      </div>
    </div>
  );
}
