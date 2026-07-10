import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth check
  const authHeader = req.headers.get("Authorization");
  const expectedKey = Deno.env.get("PULSE_API_KEY");

  if (!expectedKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader?.replace("Bearer ", "");
  if (!token || token !== expectedKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split("T")[0];

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split("T")[0];

    // Optional ?churn_window=N (days). Default 90. Clamp to [1, 3650].
    const url = new URL(req.url);
    const churnWindowRaw = url.searchParams.get("churn_window");
    const churnWindowParsed = churnWindowRaw ? parseInt(churnWindowRaw, 10) : 90;
    const churnWindowDays = Number.isFinite(churnWindowParsed)
      ? Math.min(3650, Math.max(1, churnWindowParsed))
      : 90;
    const churnWindowStart = new Date();
    churnWindowStart.setDate(churnWindowStart.getDate() - churnWindowDays);
    const churnWindowStartStr = churnWindowStart.toISOString().split("T")[0];

    const errors: Array<{ key: string; message: string }> = [];
    const safe = async <T,>(key: string, run: () => Promise<{ data: T | null; error: any }>): Promise<T | null> => {
      try {
        const { data, error } = await run();
        if (error) {
          errors.push({ key, message: error.message });
          return null;
        }
        return (data ?? null) as T | null;
      } catch (e: any) {
        errors.push({ key, message: e?.message ?? String(e) });
        return null;
      }
    };

    const [
      ceoNotesData,
      dailyMetricsData,
      dailyAcquisitionsData,
      monthlyRevenueData,
      churnEventsData,
      strategyNotesData,
      aiConversationsData,
      tasksData,
      workshopsData,
      funnelDailyData,
    ] = await Promise.all([
      safe<any[]>("ceo_notes", () => supabase.from("ceo_notes").select("*").order("date", { ascending: false })),
      safe<any[]>("daily_metrics", () => supabase.from("daily_metrics").select("*").order("date", { ascending: false }).limit(30)),
      safe<any[]>("daily_acquisitions", () => supabase.from("daily_acquisitions").select("*").order("date", { ascending: false }).gte("date", sevenDaysAgoStr)),
      safe<any[]>("monthly_revenue", () => supabase.from("monthly_revenue").select("*").order("month_start", { ascending: false })),
      safe<any[]>("churn_events", () => supabase.from("churn_events").select("*").order("date", { ascending: false }).or(`date.gte.${churnWindowStartStr},date.gt.${todayStr}`)),
      safe<any[]>("strategy_notes", () => supabase.from("strategy_notes").select("*").order("created_at", { ascending: false }).limit(5)),
      safe<any[]>("ai_conversations", () => supabase.from("ai_conversations").select("*").order("updated_at", { ascending: false }).limit(3)),
      safe<any[]>("tasks", () => supabase
        .from("tasks")
        .select("label, category, date, is_completed, is_default, sort_order, weight")
        .order("date", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(30)),
      safe<any[]>("workshops", () => supabase.from("workshops").select("*").order("workshop_date", { ascending: false })),
      safe<any[]>("funnel_daily", () => supabase.from("funnel_daily").select("*").order("date", { ascending: false })),
    ]);

    // Build workshop activity section
    const workshops = workshopsData ?? [];
    const funnelDaily = funnelDailyData ?? [];


    // Active workshop: smallest workshop_date >= today (upcoming), else most recently closed
    const upcoming = [...workshops]
      .filter((w: any) => w.workshop_date >= todayStr)
      .sort((a: any, b: any) => a.workshop_date.localeCompare(b.workshop_date))[0];
    const activeWorkshop = upcoming ?? workshops[0] ?? null;

    let activeWorkshopStatus: "upcoming" | "live" | "closed" | null = null;
    if (activeWorkshop) {
      if (activeWorkshop.workshop_date === todayStr) activeWorkshopStatus = "live";
      else if (activeWorkshop.workshop_date > todayStr) activeWorkshopStatus = "upcoming";
      else activeWorkshopStatus = "closed";
    }

    // Last 7d rows tied to active workshop
    const activeWorkshopRecentDaily = activeWorkshop
      ? funnelDaily.filter((r: any) => r.workshop_id === activeWorkshop.id && r.date >= sevenDaysAgoStr)
      : [];

    // Today's rows across BOTH funnels for completeness
    const todayAllFunnels = funnelDaily.filter((r: any) => r.date === todayStr);

    // Workshop-level totals so far + tier breakdown
    let activeWorkshopTotals: any = null;
    if (activeWorkshop) {
      const rows = funnelDaily.filter((r: any) => r.workshop_id === activeWorkshop.id);
      const t = rows.reduce(
        (a: any, r: any) => ({
          ad_spend: a.ad_spend + Number(r.ad_spend),
          regs_paid: a.regs_paid + r.registrations_paid,
          regs_org: a.regs_org + r.registrations_organic,
          workshop_rev: a.workshop_rev + Number(r.workshop_revenue),
          intensive_rev: a.intensive_rev + Number(r.intensive_revenue),
          fp_rev: a.fp_rev + Number(r.futureproof_revenue),
          fp_t27: a.fp_t27 + r.futureproof_t27,
          fp_t47: a.fp_t47 + r.futureproof_t47,
          fp_t333: a.fp_t333 + r.futureproof_t333,
        }),
        { ad_spend: 0, regs_paid: 0, regs_org: 0, workshop_rev: 0, intensive_rev: 0, fp_rev: 0, fp_t27: 0, fp_t47: 0, fp_t333: 0 },
      );
      const totalRegs = t.regs_paid + t.regs_org;
      activeWorkshopTotals = {
        total_registrations: totalRegs,
        total_ad_spend: t.ad_spend,
        registrations_paid: t.regs_paid,
        registrations_organic: t.regs_org,
        cpa_paid: t.regs_paid > 0 ? t.ad_spend / t.regs_paid : null,
        cpa_blended: totalRegs > 0 ? t.ad_spend / totalRegs : null,
        workshop_revenue: t.workshop_rev,
        intensive_revenue: t.intensive_rev,
        futureproof_revenue: t.fp_rev,
        futureproof_signups_by_tier: { t27: t.fp_t27, t47: t.fp_t47, t333: t.fp_t333 },
      };
    }

    const activeWorkshopRows = activeWorkshop
      ? funnelDaily.filter((r: any) => r.workshop_id === activeWorkshop.id)
      : [];
    const isStaleClosed =
      activeWorkshopStatus === "closed" && activeWorkshop && activeWorkshop.workshop_date < fourteenDaysAgoStr;
    const flagFlyingBlind = !!activeWorkshop && activeWorkshopRows.length === 0 && !isStaleClosed;

    // Direct-to-Skool legacy: only surface if rows in last 3 days
    const directSkoolRecent = (dailyAcquisitions.data ?? []).filter((r: any) => r.date >= threeDaysAgoStr);

    return new Response(JSON.stringify({
      pulled_at: new Date().toISOString(),
      ceo_notes: ceoNotes.data,
      daily_metrics: dailyMetrics.data,
      monthly_revenue: (monthlyRevenue.data ?? []).map((r: any) => {
        const start = r.starting_mrr == null ? null : Number(r.starting_mrr);
        const exp = Number(r.expansion_mrr ?? 0);
        const contr = Number(r.contraction_mrr ?? 0);
        const churn = Number(r.churned_mrr ?? 0);
        const nrr = start && start !== 0 ? (start + exp - contr - churn) / start : null;
        return { ...r, net_revenue_retention: nrr };
      }),
      churn_events: churnEvents.data,
      strategy_notes: strategyNotes.data,
      ai_conversations: aiConversations.data,
      tasks: tasksRes.data,
      // Section 2: ad activity — workshop-funnel-first
      ad_activity: {
        active_workshop: activeWorkshop
          ? { ...activeWorkshop, status: activeWorkshopStatus }
          : null,
        active_workshop_recent_daily: activeWorkshopRecentDaily,
        active_workshop_totals: activeWorkshopTotals,
        today_all_funnels: todayAllFunnels,
        flag_flying_blind: flagFlyingBlind,
        // Direct-to-Skool legacy: only present if there's recent (≤3d) activity
        direct_skool_legacy_recent: directSkoolRecent.length > 0 ? directSkoolRecent : null,
        direct_skool_funnel_last_7d: funnelDaily.filter((r: any) => r.funnel === "direct_skool" && r.date >= sevenDaysAgoStr),
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
