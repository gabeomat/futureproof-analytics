

## AI-Powered Insights Feature

### What We're Building

An "AI Insights" button on the Overview tab that gathers all your data (daily metrics, monthly revenue, historical trends, member composition, churn rates) and sends it to an AI model for strategic business analysis — pricing recommendations, growth advice, churn observations, and actionable next steps.

### Architecture

```text
[Overview Tab] → "Get AI Insights" button
       ↓
[Frontend] gathers data from DB + hardcoded data.ts
       ↓
[Edge Function: analyze-metrics] 
  → builds rich prompt with all metrics
  → calls Lovable AI (google/gemini-2.5-pro for deep reasoning)
  → streams response back
       ↓
[Frontend] renders streamed markdown in a dialog/sheet
```

### Implementation Steps

1. **Create edge function `supabase/functions/analyze-metrics/index.ts`**
   - Accepts daily metrics, monthly revenue, and snapshot data in request body
   - Builds a detailed system prompt positioning the AI as a SaaS/community revenue strategist
   - Prompt includes instructions to analyze: MRR trajectory, churn patterns, pricing elasticity, LTV/CAC, member composition (legacy vs current), and provide concrete strategic recommendations
   - Streams response via SSE using Lovable AI gateway with `google/gemini-2.5-pro` (best for complex reasoning)
   - Handles 429/402 errors gracefully

2. **Create `src/components/AIInsights.tsx`**
   - "Get AI Insights" button with sparkle/brain icon
   - On click: fetches latest daily_metrics and monthly_revenue from database, combines with `currentSnapshot` and `historicalRevenue` from data.ts
   - Opens a Sheet/Dialog that streams the AI response token-by-token
   - Renders response as markdown using `react-markdown`
   - Shows loading state while streaming

3. **Update `src/pages/Index.tsx`**
   - Add the AIInsights component to the Overview tab header area (next to the tab buttons or as a prominent button in the metrics section)

4. **Install `react-markdown`** dependency for rendering AI responses

### What the AI Will Analyze

The prompt will include all available data and ask for:
- MRR growth trajectory analysis and sustainability
- Churn rate assessment vs. industry benchmarks
- Pricing strategy recommendation (raise, keep, tier changes) with specific numbers
- Legacy member migration strategy
- LTV/CAC ratio health check
- 90-day action plan

### Technical Details

- Uses `LOVABLE_API_KEY` (already provisioned) — no user setup needed
- Model: `google/gemini-2.5-pro` for strongest analytical reasoning
- Streaming for responsive UX
- No database changes needed — reads existing tables

