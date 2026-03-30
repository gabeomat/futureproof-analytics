import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentSnapshot } from "@/lib/data";

export function useLiveMetrics() {
  const { data: latestMetrics } = useQuery({
    queryKey: ["latest-daily-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_metrics")
        .select("*")
        .order("date", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  const { data: acquisitionTotals } = useQuery({
    queryKey: ["acquisition-totals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_acquisitions")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;

      if (!data || data.length === 0) return null;

      let totalAdSpend = 0;
      let totalRevenue = 0;
      let rolling30AdSpend = 0;
      let rolling30Revenue = 0;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      for (const row of data) {
        totalAdSpend += Number(row.ad_spend);
        totalRevenue += Number(row.revenue);
        if (row.date >= thirtyDaysAgo) {
          rolling30AdSpend += Number(row.ad_spend);
          rolling30Revenue += Number(row.revenue);
        }
      }

      return {
        totalAdSpend,
        totalRevenue,
        rolling30AdSpend,
        rolling30Revenue,
      };
    },
  });

  // Start from the hardcoded baseline
  const liveSnapshot = { ...currentSnapshot };

  // Override with real DB data when available
  if (latestMetrics) {
    liveSnapshot.skoolMRR = Number(latestMetrics.mrr);
    liveSnapshot.totalMembers = latestMetrics.members;
  }

  // Use rolling 30-day ad spend from real data
  if (acquisitionTotals && acquisitionTotals.rolling30AdSpend > 0) {
    liveSnapshot.monthlyAdSpend = acquisitionTotals.rolling30AdSpend;
  }

  // Recalculate derived metrics from the real MRR and member counts
  if (liveSnapshot.payingMembers > 0) {
    liveSnapshot.skoolARPU = Math.round(liveSnapshot.skoolMRR / liveSnapshot.payingMembers);
  }
  if (liveSnapshot.avgChurnRate > 0) {
    liveSnapshot.calculatedLTV = Math.round(liveSnapshot.skoolARPU / (liveSnapshot.avgChurnRate / 100));
    liveSnapshot.skoolLTV = Math.round(liveSnapshot.skoolARPU / (liveSnapshot.avgChurnRate / 100));
  }

  return liveSnapshot;
}
