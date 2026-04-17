# Futureproof Analytics

**MRR & Growth Intelligence dashboard for The Evolution Lab.**

A private, AI-augmented business analytics dashboard built to track Monthly Recurring Revenue (MRR), member composition, churn, and growth projections for a Skool-based community business. It combines daily/monthly data entry, live KPI tracking, scenario modeling, and an AI strategy assistant — plus a secure read-only API endpoint for external integrations (e.g. a daily "morning pulse" briefing).

---

## What this app does

### 📊 Overview Dashboard
At-a-glance KPIs and visualizations:
- **Pure Monthly MRR** vs. **Skool MRR** (which includes annualized annual subscriptions)
- **Paying members** broken down by monthly vs. annual
- **Revenue churn** vs. target
- **Calculated LTV** (overall and Skool-specific)
- **Legacy member tracking** (older pricing tiers shrinking over time)
- Charts: MRR trend, revenue breakdown, churn analysis, member composition, dual-MRR view

### 🎚️ MRR Projection Playground
Interactive scenario modeling — adjust growth rate, churn rate, and pricing levers to project MRR trajectory forward.

### ✍️ Data Entry
Monthly Skool MRR breakdown input: New, Upgrades, Existing, Downgrades, Churn. Also supports CEO daily notes (biggest win, biggest bottleneck, today's focus), daily metrics (members, MRR, traffic, activity), daily acquisitions (ad spend & conversions per price tier), and individual churn events.

### 🤖 AI Insights
A built-in chat assistant powered by Lovable AI (Google Gemini) that has live read access to your business data and can:
- Answer ad-hoc questions about your metrics
- Diagnose trends and surface bottlenecks
- Save strategy summaries to a dedicated `strategy_notes` table via a "Save Summary" button

### 🌅 Morning Pulse API
A secure, read-only Supabase Edge Function (`/functions/v1/morning-pulse`) that returns a JSON snapshot of recent business data. Authenticated with a bearer `PULSE_API_KEY`, designed to be polled by an external service (e.g. to generate a daily briefing email or Slack message).

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend framework | **React 18** + **TypeScript** + **Vite 5** |
| Styling | **Tailwind CSS v3** with HSL semantic design tokens |
| UI components | **shadcn/ui** (Radix primitives) + **lucide-react** icons |
| Charts | **Recharts** |
| Routing | **react-router-dom** |
| Forms & validation | **react-hook-form** + **zod** |
| Data fetching | **@tanstack/react-query** |
| Markdown rendering | **react-markdown** (for AI chat output) |
| Backend | **Lovable Cloud** (managed Supabase) — Postgres, Auth, Edge Functions |
| AI | **Lovable AI Gateway** (Google Gemini models, no API key required) |
| Testing | **Vitest** + **Testing Library** + **Playwright** |

---

## Backend architecture

The app is connected to Lovable Cloud, which provides a managed Postgres database, authentication, and Deno-based edge functions.

### Database tables
- `daily_metrics` — daily MRR, members, traffic, group/profile activity, discovery rank
- `daily_acquisitions` — daily ad spend and conversions per price point (£27 / £47 / £333)
- `monthly_revenue` — monthly new revenue and revenue churn
- `churn_events` — individual cancellation events with LTV, tier, and notes
- `ceo_notes` — daily CEO journal (one per day, upserted on `date`)
- `ai_conversations` — saved AI chat history
- `strategy_notes` — AI-generated strategy summaries linked back to source conversations

### Edge functions
- **`analyze-metrics`** — proxies AI chat requests through the Lovable AI Gateway with live business context
- **`morning-pulse`** — secure read-only API returning aggregated recent data (auth via `PULSE_API_KEY` bearer token, CORS-open for external callers)

### Auth
Email + password authentication with a `ProtectedRoute` wrapper guarding the dashboard. Sign-out lives in the header.

---

## Project structure

```
src/
├── components/        # Dashboard widgets (charts, metric cards, AI chat, data entry)
│   └── ui/            # shadcn/ui primitives
├── hooks/             # useLiveMetrics (subscribes to live DB data), use-toast, use-mobile
├── integrations/
│   └── supabase/      # Auto-generated client + types (do not edit)
├── lib/               # Data formatters and shared utilities
├── pages/             # Index (dashboard), Auth, NotFound
└── test/              # Vitest setup and example tests
supabase/
├── functions/
│   ├── analyze-metrics/   # AI chat edge function
│   └── morning-pulse/     # Read-only daily snapshot API
└── migrations/        # Database schema (managed by Lovable)
```

---

## Local development

```bash
npm install
npm run dev          # start Vite dev server
npm run build        # production build
npm run lint         # ESLint
npm run test         # run Vitest suite
```

Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`) are auto-managed by Lovable Cloud — do not edit `.env` manually.

---

## Built with

This app was designed and built using [Lovable](https://lovable.dev) — an AI-powered full-stack app builder. The backend (database, auth, edge functions, AI gateway) is provided by Lovable Cloud, with no separate infrastructure setup required.
