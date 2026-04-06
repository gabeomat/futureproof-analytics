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

    const [
      ceoNotes,
      dailyMetrics,
      dailyAcquisitions,
      monthlyRevenue,
      churnEvents,
      strategyNotes,
      aiConversations,
    ] = await Promise.all([
      supabase.from("ceo_notes").select("*").order("date", { ascending: false }),
      supabase.from("daily_metrics").select("*").order("date", { ascending: false }).limit(3),
      supabase.from("daily_acquisitions").select("*").order("date", { ascending: false }).gte("date", sevenDaysAgoStr),
      supabase.from("monthly_revenue").select("*").order("month", { ascending: false }),
      supabase.from("churn_events").select("*").order("date", { ascending: false }).gte("date", sevenDaysAgoStr),
      supabase.from("strategy_notes").select("*").order("created_at", { ascending: false }).limit(1),
      supabase.from("ai_conversations").select("*").order("updated_at", { ascending: false }).limit(1),
    ]);

    // Check for errors
    const queries = { ceoNotes, dailyMetrics, dailyAcquisitions, monthlyRevenue, churnEvents, strategyNotes, aiConversations };
    for (const [name, result] of Object.entries(queries)) {
      if (result.error) {
        return new Response(JSON.stringify({ error: `Failed to fetch ${name}: ${result.error.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({
      pulled_at: new Date().toISOString(),
      ceo_notes: ceoNotes.data,
      daily_metrics: dailyMetrics.data,
      daily_acquisitions: dailyAcquisitions.data,
      monthly_revenue: monthlyRevenue.data,
      churn_events: churnEvents.data,
      strategy_notes: strategyNotes.data,
      ai_conversations: aiConversations.data,
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
