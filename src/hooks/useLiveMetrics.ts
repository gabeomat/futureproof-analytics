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

      let totalAdConv27 = 0, totalAdConv47 = 0, totalAdConv333 = 0;
      let totalOrganic27 = 0, totalOrganic47 = 0, totalOrganic333 = 0;
      let totalAdSpend = 0;

      for (const row of data) {
        totalAdConv27 += row.ad_conv_27;
        totalAdConv47 += row.ad_conv_47;
        totalAdConv333 += row.ad_conv_333;
        totalOrganic27 += row.organic_27;
        totalOrganic47 += row.organic_47;
        totalOrganic333 += row.organic_333;
        totalAdSpend += Number(row.ad_spend);
      }

      const totalNewMonthly = totalAdConv27 + totalAdConv47 + totalOrganic27 + totalOrganic47;
      const totalNewAnnual = totalAdConv333 + totalOrganic333;
      const totalNewMRR = (totalAdConv27 + totalOrganic27) * 27 + (totalAdConv47 + totalOrganic47) * 47;
      const totalNewAnnualMRR = (totalAdConv333 + totalOrganic333) * (333 / 12);

      return {
        totalNewMonthly,
        totalNewAnnual,
        totalNewMRR,
        totalNewAnnualMRR,
        totalAdSpend,
        totalConversions: totalNewMonthly + totalNewAnnual,
      };
    },
  });

  // Build a live snapshot that merges DB data with the hardcoded baseline
  const liveSnapshot = { ...currentSnapshot };

  if (latestMetrics) {
    // Use the latest daily_metrics MRR and member count as the source of truth
    liveSnapshot.skoolMRR = Number(latestMetrics.mrr);
    liveSnapshot.totalMembers = latestMetrics.members;
  }

  if (acquisitionTotals) {
    // Add new members from acquisitions to baseline paying members
    liveSnapshot.payingMembers = currentSnapshot.payingMembers + acquisitionTotals.totalNewMonthly + acquisitionTotals.totalNewAnnual;
    liveSnapshot.monthlyPayingMembers = currentSnapshot.monthlyPayingMembers + acquisitionTotals.totalNewMonthly;
    liveSnapshot.annualPayingMembers = currentSnapshot.annualPayingMembers + acquisitionTotals.totalNewAnnual;
    liveSnapshot.pureMonthlyMRR = currentSnapshot.pureMonthlyMRR + acquisitionTotals.totalNewMRR;
    liveSnapshot.annualizedContribution = currentSnapshot.annualizedContribution + acquisitionTotals.totalNewAnnualMRR;

    // Replace hardcoded monthlyAdSpend with rolling 30-day real data
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    // acquisitionTotals uses ALL data; we need to recalculate for just last 30 days
    // We'll use a separate query result for this
  }

  // Recalculate derived metrics
  if (liveSnapshot.payingMembers > 0) {
    liveSnapshot.skoolARPU = Math.round(liveSnapshot.skoolMRR / liveSnapshot.payingMembers);
    liveSnapshot.currentPricingMembers = liveSnapshot.payingMembers - liveSnapshot.legacyMembers;
  }
  if (liveSnapshot.avgChurnRate > 0) {
    liveSnapshot.calculatedLTV = Math.round(liveSnapshot.skoolARPU / (liveSnapshot.avgChurnRate / 100));
    liveSnapshot.skoolLTV = Math.round(liveSnapshot.skoolARPU / (liveSnapshot.avgChurnRate / 100));
  }

  return liveSnapshot;
}
