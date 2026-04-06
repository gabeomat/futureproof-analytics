import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const queryToken = url.searchParams.get("token");
    const authHeader = req.headers.get("Authorization");
    const headerToken = authHeader?.replace("Bearer ", "");
    const token = headerToken || queryToken;
    const expectedToken = Deno.env.get("PULSE_API_TOKEN");

    if (!expectedToken || token !== expectedToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysStr = sevenDaysAgo.toISOString().split("T")[0];

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fourteenDaysStr = fourteenDaysAgo.toISOString();

    const [
      dailyMetrics,
      dailyAcquisitions,
      churnEvents,
      ceoNotes,
      aiConversations,
      monthlyRevenue,
      strategyNotes,
      aiInsights,
    ] = await Promise.all([
      supabase.from("daily_metrics").select("*").gte("date", sevenDaysStr).order("date", { ascending: false }),
      supabase.from("daily_acquisitions").select("*").gte("date", sevenDaysStr).order("date", { ascending: false }),
      supabase.from("churn_events").select("*").gte("date", sevenDaysStr).order("date", { ascending: false }),
      supabase.from("ceo_notes").select("*").gte("created_at", fourteenDaysStr).order("created_at", { ascending: false }),
      supabase.from("ai_conversations").select("*").gte("created_at", fourteenDaysStr).order("created_at", { ascending: false }),
      supabase.from("monthly_revenue").select("*").order("month", { ascending: false }).limit(1),
      supabase.from("strategy_notes").select("*").order("created_at", { ascending: false }).limit(1),
      supabase.from("ai_insights").select("*").order("session_date", { ascending: false }).limit(3),
    ]);

    return new Response(
      JSON.stringify({
        daily_metrics: dailyMetrics.data ?? [],
        daily_acquisitions: dailyAcquisitions.data ?? [],
        churn_events: churnEvents.data ?? [],
        ceo_notes: ceoNotes.data ?? [],
        ai_conversations: aiConversations.data ?? [],
        monthly_revenue: monthlyRevenue.data ?? [],
        strategy_notes: strategyNotes.data ?? [],
        ai_insights: (aiInsights as any).data ?? [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("morning-pulse-api error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
