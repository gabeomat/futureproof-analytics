import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/data";
import { tierRevenue } from "@/lib/pricing";
import { ChurnChart } from "@/components/ChurnAnalysis";
import { MetricCard } from "@/components/MetricCard";
import { useLiveMetrics } from "@/hooks/useLiveMetrics";

type Workshop = {
  id: string;
  workshop_date: string;
  title: string;
  intensive_price: number;
  intensive_waitlist_mode: boolean;
  total_registrations: number;
  meta_attributed_registrations: number;
  attended: number | null;
  intensive_applications: number;
  intensive_declined: number;
  intensive_closes: number;
  notes: string;
};

type DailyRow = {
  date: string;
  funnel: string;
  workshop_id: string | null;
  ad_spend: number;
  registrations_paid: number;
  registrations_organic: number;
  workshop_revenue: number;
  intensive_revenue: number;
  futureproof_revenue: number;
  futureproof_t27: number;
  futureproof_t47: number;
  futureproof_t333: number;
};

const today = () => new Date().toISOString().slice(0, 10);

function workshopStatus(date: string): { label: string; variant: "default" | "secondary" | "outline" } {
  const t = today();
  if (date > t) return { label: "Upcoming", variant: "default" };
  if (date === t) return { label: "Live", variant: "secondary" };
  return { label: "Closed", variant: "outline" };
}

export function WorkshopFunnelOverview() {
  const live = useLiveMetrics();

  const { data: workshops = [], isLoading: wsLoading } = useQuery({
    queryKey: ["workshop-funnel", "workshops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workshops")
        .select("*")
        .order("workshop_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Workshop[];
    },
  });

  const { data: dailyRows = [], isLoading: dailyLoading } = useQuery({
    queryKey: ["workshop-funnel", "daily"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funnel_daily")
        .select("*")
        .eq("funnel", "workshop");
      if (error) throw error;
      return (data ?? []) as DailyRow[];
    },
  });

  const perWorkshop = useMemo(() => {
    const map = new Map<string, DailyRow[]>();
    for (const r of dailyRows) {
      if (!r.workshop_id) continue;
      const arr = map.get(r.workshop_id) ?? [];
      arr.push(r);
      map.set(r.workshop_id, arr);
    }
    return map;
  }, [dailyRows]);

  if (wsLoading || dailyLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /><span className="text-sm">Loading workshop funnel…</span>
      </div>
    );
  }

  if (workshops.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center text-muted-foreground">
          <p className="text-sm">No workshops yet.</p>
          <p className="text-xs mt-1">Create your first workshop in Data Entry → Workshop.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Per-workshop P&L cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {workshops.map((w) => {
          const rows = perWorkshop.get(w.id) ?? [];
          const totals = rows.reduce(
            (acc, r) => ({
              ad_spend: acc.ad_spend + Number(r.ad_spend),
              regs_paid: acc.regs_paid + r.registrations_paid,
              regs_org: acc.regs_org + r.registrations_organic,
              workshop_rev: acc.workshop_rev + Number(r.workshop_revenue),
              intensive_rev: acc.intensive_rev + Number(r.intensive_revenue),
              fp_t27: acc.fp_t27 + r.futureproof_t27,
              fp_t47: acc.fp_t47 + r.futureproof_t47,
              fp_t333: acc.fp_t333 + r.futureproof_t333,
              fp_rev: acc.fp_rev + tierRevenue(r.date, { standard: r.futureproof_t27, premium: r.futureproof_t47, annual: r.futureproof_t333 }),
            }),
            { ad_spend: 0, regs_paid: 0, regs_org: 0, workshop_rev: 0, intensive_rev: 0, fp_t27: 0, fp_t47: 0, fp_t333: 0, fp_rev: 0 },
          );
          // Sum revenue per-row using date-aware pricing so legacy and new-pricing
          // signups each apply the correct tier prices.
          const fp_rev = totals.fp_rev;
          const totalRegs = totals.regs_paid + totals.regs_org;
          const cpa = totals.regs_paid > 0 ? totals.ad_spend / totals.regs_paid : null;
          const blended = totalRegs > 0 ? totals.ad_spend / totalRegs : null;
          const showRate = w.attended != null && w.total_registrations > 0
            ? (w.attended / w.total_registrations) * 100 : null;
          const totalRev = totals.workshop_rev + totals.intensive_rev + fp_rev;
          const roas = totals.ad_spend > 0 ? totalRev / totals.ad_spend : 0;
          const status = workshopStatus(w.workshop_date);

          return (
            <Card key={w.id} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-display font-semibold">
                      {w.workshop_date} — {w.title}
                    </CardTitle>
                    {w.notes && <p className="text-[11px] text-muted-foreground mt-1 italic">{w.notes}</p>}
                  </div>
                  <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Funnel breakdown */}
                <div className="rounded-md border border-border p-3 space-y-2 bg-secondary/30">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Funnel</p>
                  <div className="text-xs space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ad spend</span>
                      <span className="text-foreground">{formatCurrency(totals.ad_spend)} · CPA {cpa != null ? formatCurrency(cpa) : "—"} · Blended {blended != null ? formatCurrency(blended) : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">→ Registrations</span>
                      <span className="text-foreground">{w.total_registrations} ({totals.regs_paid} paid + {totals.regs_org} organic from daily)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">→ Attended</span>
                      <span className="text-foreground">
                        {w.attended != null ? `${w.attended}${showRate != null ? ` (${showRate.toFixed(0)}% show)` : ""}` : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">→ Intensive</span>
                      <span className="text-foreground">
                        {w.intensive_waitlist_mode
                          ? "Waitlist mode"
                          : `${w.intensive_applications} apps · ${w.intensive_declined} declined · ${w.intensive_closes} closes`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">→ Futureproof</span>
                      <span className="text-foreground">{totals.fp_t27} std · {totals.fp_t47} prem · {totals.fp_t333} ann</span>
                    </div>
                  </div>
                </div>

                {/* Revenue rollup */}
                <div className="rounded-md border border-primary/20 p-3 space-y-2 bg-primary/5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Revenue</p>
                  <div className="text-xs space-y-1 font-mono">
                    <div className="flex justify-between"><span className="text-muted-foreground">Workshop</span><span>{formatCurrency(totals.workshop_rev)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Intensive</span><span>{formatCurrency(totals.intensive_rev)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Futureproof (one-time view)</span><span>{formatCurrency(fp_rev)}</span></div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-border mt-1">
                      <span className="text-foreground">Total</span>
                      <span className="text-primary">{formatCurrency(totalRev)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ROAS (one-time)</span>
                      <span className={roas >= 1 ? "text-primary" : "text-destructive"}>
                        {totals.ad_spend > 0 ? `${roas.toFixed(2)}x` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recurring Revenue Health */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold font-display text-foreground">Recurring Revenue Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <MetricCard title="Pure Monthly MRR" value={formatCurrency(live.pureMonthlyMRR)} />
            <MetricCard title="Skool MRR" value={formatCurrency(live.skoolMRR)} subtitle="Includes annualized annual" />
            <MetricCard title="Paying Members" value={`${live.payingMembers}`} />
          </div>
          <ChurnChart />
        </CardContent>
      </Card>
    </div>
  );
}
