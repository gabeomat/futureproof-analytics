import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a senior SaaS revenue strategist and community business analyst. You specialize in subscription-based communities (like Skool) and have deep expertise in MRR optimization, churn reduction, pricing strategy, and member lifecycle management.

You will receive a comprehensive data package about a paid community business. Analyze it thoroughly and provide strategic, data-driven insights.

Structure your response with these sections using markdown:

## 📊 MRR Trajectory Analysis
Assess growth rate, sustainability, and momentum. Reference specific month-over-month changes.

## 🔄 Churn Deep Dive
Evaluate revenue churn rate vs. industry benchmarks (typical SaaS: 5-7%, community: 8-12%). Identify patterns and root causes.

## 💰 Pricing Strategy Recommendation
Should they raise prices, keep them, or restructure tiers? Provide SPECIFIC numbers and reasoning. Consider price elasticity and competitive positioning.

## 👥 Legacy Member Migration Strategy
How to handle grandfathered members on lower pricing. Recommend specific tactics with timelines.

## 📈 LTV & Unit Economics
Assess LTV/CAC ratio health. Is ad spend efficient? What's the payback period?

## 🎯 90-Day Action Plan
Provide 5-7 specific, prioritized actions with expected impact on MRR.

Be direct, specific, and use actual numbers from the data. Avoid generic advice. Every recommendation should tie back to the data provided.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { snapshot, historicalRevenue, churnData, monthlyMembers, annualMembers, dailyMetrics, monthlyRevenue } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userPrompt = `Here is the complete data package for analysis:

**Current Snapshot:**
${JSON.stringify(snapshot, null, 2)}

**Historical Monthly Revenue (Skool breakdown):**
${JSON.stringify(historicalRevenue, null, 2)}

**Churn History:**
${JSON.stringify(churnData, null, 2)}

**Monthly Member Tiers:**
${JSON.stringify(monthlyMembers, null, 2)}

**Annual Member Tiers:**
${JSON.stringify(annualMembers, null, 2)}

**Daily Metrics from Database (most recent entries):**
${JSON.stringify(dailyMetrics || [], null, 2)}

**Monthly Revenue from Database:**
${JSON.stringify(monthlyRevenue || [], null, 2)}

Please analyze this data comprehensively and provide your strategic recommendations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analyze-metrics error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
