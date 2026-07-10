import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a senior SaaS revenue strategist and community business analyst. You specialize in subscription-based communities (like Skool) and have deep expertise in MRR optimization, churn reduction, pricing strategy, and member lifecycle management.

You have access to the full data package for this paid community business. Use it to answer questions with specific, data-driven insights.

**Pricing Structure Context (use this to make better recommendations, not as a hard block):**
This community runs on Skool, which caps pricing at 3 tiers total (free counts as one). Tiers can be monthly or annual.

Pricing history — legacy members are grandfathered at each prior price:
- Started FREE to seed membership.
- ~60 members: introduced low-ticket paid — $9/mo or $50/yr.
- ~100 members: raised to $18/mo or $111/yr.
- $27/$47/$333 era (Sep 2025 – Jun 27 2026): $27/mo, $47/mo, $333/yr.
- Current pricing (effective Jun 28 2026): $37/mo (Standard), $57/mo (Premium), $400/yr (Annual). These are the only tiers new members can join today. Members from prior eras are grandfathered.

Founder's current strategic posture (factor this in, but price increases ARE on the table when the data supports them):
- Legacy low-tier members will NOT be removed. Kicking them out is off the table — they provide social proof (a 170-member community sells better than 70) and asset value even at low ARPU. Migration/upsell tactics are welcome; forced removal is not.
- The 3-tier cap is a real constraint. Any "add a new tier" recommendation must specify which existing tier it replaces.
- New content is built primarily for the top tier ($400/yr), which is where the real value lives and where sales effort is concentrated.

**Active experiment — 2026-07-11 workshop is FREE (ticket price $0):** The founder is testing whether a free front-end workshop drives more Futureproof back-end conversions than the paid $27 ticket. Do NOT flag "$0 workshop revenue" or "low ticket revenue" as a problem for this cohort — it's intentional. Judge this workshop's ROAS on Intensive + Futureproof upgrade revenue only, and compare paid-ticket vs. free-ticket funnel conversion rates side-by-side when analyzing. Results won't be conclusive until post-workshop backend sales land.

You CAN recommend further raising prices on the current $37/$57/$400 tiers (or restructuring them) when the data clearly supports it — strong demand signals, low price-sensitivity churn, healthy conversion, etc. Just be specific about the trigger conditions and expected impact, and don't repeat the same pricing recommendation across sessions if it's already been considered. Prefer recommendations that work with the current structure (top-tier conversion, upsell paths, retention for legacy members, positioning) unless the data genuinely warrants a tier change.

When giving your initial analysis, structure your response with these sections using markdown:

## 📊 MRR Trajectory Analysis
Assess growth rate, sustainability, and momentum. Reference specific month-over-month changes.

## 🔄 Churn Deep Dive
Evaluate revenue churn rate vs. industry benchmarks (typical SaaS: 5-7%, community: 8-12%). Identify patterns and root causes. You have access to individual churn event records — analyze churn by price tier, tenure (time from joined_date to churn date), and look for cohort patterns. Flag if certain tiers or join cohorts churn faster than others.

## 💰 Pricing Strategy Recommendation
Should they raise prices, keep them, or restructure tiers? Provide SPECIFIC numbers and reasoning.

## 👥 Legacy Member Migration Strategy
How to handle grandfathered members on lower pricing. Recommend specific tactics with timelines.

## 📈 LTV & Unit Economics
Assess LTV/CAC ratio health. Is ad spend efficient? What's the payback period? If Skool member data is available, analyze the active member base composition, join date distribution, and engagement tiers.

## 🎯 90-Day Action Plan
Provide 5-7 specific, prioritized actions with expected impact on MRR. If CEO daily notes are available, factor in the founder's current bottlenecks and focus areas when prioritizing — recommendations that address active bottlenecks should rank higher. Reference recent wins to reinforce what's working.

For follow-up questions, respond naturally and conversationally while still being data-driven and specific. Reference the data you have whenever relevant.

When images are shared with you, analyze them thoroughly. If they are ad creatives, evaluate:
- Visual design and attention-grabbing elements
- Copy effectiveness and clarity of value proposition
- Call-to-action strength
- Target audience alignment
- Suggestions for improvement based on the business data you have

Be direct, specific, and use actual numbers from the data. Avoid generic advice. Every recommendation should tie back to the data provided.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { snapshot, historicalRevenue, churnData, monthlyMembers, annualMembers, dailyMetrics, monthlyRevenue, acquisitionData, churnEvents, skoolMembers, ceoNotes, workshops, funnelDaily, trialCohorts, messages, recentConversations } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build the data context that's always prepended
    let dataContext = `Here is the complete data package for analysis:

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

**Daily Acquisition Data (Ad Spend, Ad Conversions by tier, Organic sign-ups by tier):**
Price tiers: pre-Jun 28 2026 = $27/$47/$333; from Jun 28 2026 onward = $37/$57/$400. Apply the tier prices that match each row's date when computing per-row revenue.
${JSON.stringify(acquisitionData || [], null, 2)}

**Individual Churn Events (each churned member with details):**
Fields: date (actual or estimated churn date), first_name, last_name, email, price_point (their monthly $), tier, joined_date, ltv (lifetime value paid, cumulative across stints for rejoiners), recurring_interval ('month' or 'year'), churn_date_estimated (true = date derived from joined_date + ltv/price), notes
NOTE: Exclude rows with recurring_interval='year' from any monthly churn-rate calculation; their LTV still counts toward lifetime views. Always group churn by the date field (real churn timing), never by import time.
${JSON.stringify(churnEvents || [], null, 2)}


**Current Skool Members (from latest member export):**
${JSON.stringify(skoolMembers || [], null, 2)}

**CEO Daily Notes (founder's wins, bottlenecks, focus areas, and context):**
Fields: date, biggest_win, biggest_bottleneck, todays_focus, notes (optional free-text context)
${JSON.stringify(ceoNotes || [], null, 2)}`;

    // Inject recent conversation context (replaces old strategy_notes)
    if (recentConversations && recentConversations.length > 0) {
      dataContext += `\n\n**Recent Session Context (from your last ${recentConversations.length} conversation${recentConversations.length > 1 ? 's' : ''}):**\n`;
      for (const conv of recentConversations) {
        const date = new Date(conv.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        dataContext += `\n--- Session from ${date}: "${conv.title}" ---\n`;
        // Include only assistant messages, trimmed to manage token usage
        const assistantMsgs = (conv.messages || [])
          .filter((m: { role: string }) => m.role === "assistant")
          .map((m: { content: string }) => m.content);
        for (const content of assistantMsgs) {
          const trimmed = content.length > 2000 ? content.slice(0, 2000) + "\n[...trimmed for brevity]" : content;
          dataContext += trimmed + "\n";
        }
      }
      dataContext += `\nUse these past sessions for context. Reference previous recommendations when relevant, and note whether enough time has passed to evaluate their impact.`;
    }

    // Build messages for the AI, supporting multimodal content (text + images)
    const buildContent = (msg: { role: string; content: string; imageUrls?: string[] }) => {
      if (msg.imageUrls && msg.imageUrls.length > 0) {
        const parts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
        if (msg.content) {
          parts.push({ type: "text", text: msg.content });
        }
        for (const url of msg.imageUrls) {
          parts.push({ type: "image_url", image_url: { url } });
        }
        return parts;
      }
      return msg.content;
    };

    let aiMessages: Array<{ role: string; content: unknown }>;

    if (messages && messages.length > 0) {
      aiMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: dataContext + "\n\nPlease analyze this data comprehensively and provide your strategic recommendations." },
        ...messages.map((m: { role: string; content: string; imageUrls?: string[] }) => ({
          role: m.role,
          content: buildContent(m),
        })),
      ];
    } else {
      aiMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: dataContext + "\n\nPlease analyze this data comprehensively and provide your strategic recommendations." },
      ];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: aiMessages,
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
