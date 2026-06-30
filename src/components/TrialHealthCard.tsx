import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/data";
import { Beaker } from "lucide-react";

const LTV = 266;

export function TrialHealthCard() {
  const { data: rows = [] } = useQuery({
    queryKey: ["trial-health"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trial_cohorts")
        .select("trial_start_date, trial_starts, ad_spend_attributed, day7_paid")
        .order("trial_start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const mature = rows.filter((r) => {
    const d = new Date(r.trial_start_date + "T00:00:00");
    return today.getTime() - d.getTime() >= sevenDaysMs;
  });

  const totalStarts = mature.reduce((s, r) => s + (r.trial_starts || 0), 0);
  const totalPaid = mature.reduce((s, r) => s + (r.day7_paid || 0), 0);
  const totalSpend = mature.reduce((s, r) => s + Number(r.ad_spend_attributed || 0), 0);
  const rate = totalStarts > 0 ? (totalPaid / totalStarts) * 100 : null;
  const cac = totalPaid > 0 ? totalSpend / totalPaid : null;
  const roas = totalSpend > 0 ? (totalPaid * LTV) / totalSpend : null;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground font-display flex items-center gap-2">
          <Beaker className="w-5 h-5 text-primary" />
          Trial Health
          <span className="text-xs font-mono text-muted-foreground font-normal">
            ({mature.length} mature cohort{mature.length === 1 ? "" : "s"})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {mature.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No mature cohorts yet (need ≥ 7 days since trial start).</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Stat label="Mature Trial Starts" value={String(totalStarts)} />
            <Stat label="Paid Conversions (D7)" value={String(totalPaid)} />
            <Stat label="Trial → Paid" value={rate != null ? `${rate.toFixed(1)}%` : "—"} highlight />
            <Stat label="CAC per Paid" value={cac != null ? formatCurrency(cac) : "—"} />
            <Stat label="LTV ROAS" value={roas != null ? `${roas.toFixed(2)}×` : "—"} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold font-mono mt-1 ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
