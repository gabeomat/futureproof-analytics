import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { formatCurrency } from "@/lib/data";
import { Loader2 } from "lucide-react";

export function AllRevenueOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["all-revenue-rollup"],
    queryFn: async () => {
      const [funnelRes, acqRes] = await Promise.all([
        supabase.from("funnel_daily").select("*"),
        supabase.from("daily_acquisitions").select("*"),
      ]);
      if (funnelRes.error) throw funnelRes.error;
      if (acqRes.error) throw acqRes.error;

      const funnel = funnelRes.data ?? [];
      const acq = acqRes.data ?? [];

      const wsTotals = funnel.filter((r: any) => r.funnel === "workshop").reduce(
        (a: any, r: any) => ({
          ad_spend: a.ad_spend + Number(r.ad_spend),
          revenue: a.revenue + Number(r.workshop_revenue) + Number(r.intensive_revenue) + Number(r.futureproof_revenue),
        }),
        { ad_spend: 0, revenue: 0 },
      );
      const directFunnel = funnel.filter((r: any) => r.funnel === "direct_skool").reduce(
        (a: any, r: any) => ({
          ad_spend: a.ad_spend + Number(r.ad_spend),
          revenue: a.revenue + Number(r.workshop_revenue) + Number(r.intensive_revenue) + Number(r.futureproof_revenue),
        }),
        { ad_spend: 0, revenue: 0 },
      );
      const acqTotals = acq.reduce(
        (a: any, r: any) => ({
          ad_spend: a.ad_spend + Number(r.ad_spend),
          revenue: a.revenue + Number(r.revenue),
        }),
        { ad_spend: 0, revenue: 0 },
      );

      const totalAd = wsTotals.ad_spend + directFunnel.ad_spend + acqTotals.ad_spend;
      const totalRev = wsTotals.revenue + directFunnel.revenue + acqTotals.revenue;
      return {
        workshop: wsTotals,
        direct: { ad_spend: directFunnel.ad_spend + acqTotals.ad_spend, revenue: directFunnel.revenue + acqTotals.revenue },
        total: { ad_spend: totalAd, revenue: totalRev, roas: totalAd > 0 ? totalRev / totalAd : 0 },
      };
    },
  });

  if (isLoading || !data) {
    return <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /><span className="text-sm">Loading…</span></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard title="Total Ad Spend" value={formatCurrency(data.total.ad_spend)} />
        <MetricCard title="Total Revenue" value={formatCurrency(data.total.revenue)} variant="primary" />
        <MetricCard title="Blended ROAS" value={data.total.ad_spend > 0 ? `${data.total.roas.toFixed(2)}x` : "—"} />
        <MetricCard title="Net" value={formatCurrency(data.total.revenue - data.total.ad_spend)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-display">Workshop Funnel</CardTitle></CardHeader>
          <CardContent className="text-xs font-mono space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Ad spend</span><span>{formatCurrency(data.workshop.ad_spend)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="text-primary">{formatCurrency(data.workshop.revenue)}</span></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-display">Direct-to-Skool (incl. legacy)</CardTitle></CardHeader>
          <CardContent className="text-xs font-mono space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Ad spend</span><span>{formatCurrency(data.direct.ad_spend)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="text-primary">{formatCurrency(data.direct.revenue)}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
