import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  // Only allow GET
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Authenticate via x-api-key header
  const apiKey = req.headers.get("x-api-key");
  const expectedKey = Deno.env.get("CLAUDE_SYNC_API_KEY");

  if (!apiKey || apiKey !== expectedKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    // Fetch last 7 days of daily_metrics
    const { data: metrics, error: metricsErr } = await supabase
      .from("daily_metrics")
      .select("*")
      .gte("date", sevenDaysAgoStr)
      .order("date", { ascending: false });

    if (metricsErr) throw metricsErr;

    // Fetch last 7 days of daily_acquisitions
    const { data: acquisitions, error: acqErr } = await supabase
      .from("daily_acquisitions")
      .select("*")
      .gte("date", sevenDaysAgoStr)
      .order("date", { ascending: false });

    if (acqErr) throw acqErr;

    // Fetch last 7 days of churn_events
    const { data: churnEvents, error: churnErr } = await supabase
      .from("churn_events")
      .select("*")
      .gte("date", sevenDaysAgoStr)
      .order("date", { ascending: false });

    if (churnErr) throw churnErr;

    // Build a lookup for acquisitions and churn by date
    const acqByDate: Record<string, any> = {};
    for (const a of acquisitions || []) {
      acqByDate[a.date] = a;
    }

    const churnByDate: Record<string, any[]> = {};
    for (const c of churnEvents || []) {
      if (!churnByDate[c.date]) churnByDate[c.date] = [];
      churnByDate[c.date].push(c);
    }

    // Merge into daily array
    const daily = (metrics || []).map((m: any) => {
      const acq = acqByDate[m.date] || {};
      const dayChurn = churnByDate[m.date] || [];
      const cancellations = dayChurn.length;

      const totalAdConversions =
        (acq.ad_conv_27 || 0) + (acq.ad_conv_47 || 0) + (acq.ad_conv_333 || 0);
      const totalOrganicSignups =
        (acq.organic_27 || 0) + (acq.organic_47 || 0) + (acq.organic_333 || 0);
      const totalNewSignups = totalAdConversions + totalOrganicSignups;

      const adSpend = Number(acq.ad_spend) || 0;
      const cpa = totalAdConversions > 0 ? adSpend / totalAdConversions : null;
      const revenue = Number(acq.revenue) || 0;
      const roas = adSpend > 0 ? revenue / adSpend : null;

      return {
        date: m.date,
        skool_members_total: m.members,
        skool_new_signups: totalNewSignups,
        skool_cancellations: cancellations,
        skool_tier_breakdown: {
          t27: (acq.ad_conv_27 || 0) + (acq.organic_27 || 0),
          t47: (acq.ad_conv_47 || 0) + (acq.organic_47 || 0),
          t333: (acq.ad_conv_333 || 0) + (acq.organic_333 || 0),
        },
        ad_spend: adSpend,
        ad_impressions: null,
        ad_clicks: null,
        ad_conversions: totalAdConversions,
        ad_cpa: cpa,
        ad_roas: roas,
        revenue_mrr: Number(m.mrr) || null,
        group_activity: m.group_activity,
        profile_activity: m.profile_activity,
        discovery_rank: m.discovery_rank,
        about_page_traffic: m.about_page_traffic,
        notes: "",
      };
    });

    // Fetch last 2 AI conversations
    const { data: conversations, error: convErr } = await supabase
      .from("ai_conversations")
      .select("id, created_at, messages")
      .order("created_at", { ascending: false })
      .limit(2);

    if (convErr) throw convErr;

    const formattedConversations = (conversations || []).map((c: any) => ({
      conversation_id: c.id,
      created_at: c.created_at,
      messages: Array.isArray(c.messages)
        ? c.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          }))
        : [],
    }));

    const response = {
      generated_at: now.toISOString(),
      metrics: {
        period: "last_7_days",
        daily,
      },
      analyst_insights: {
        conversations_returned: formattedConversations.length,
        conversations: formattedConversations,
      },
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("claude-sync error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
