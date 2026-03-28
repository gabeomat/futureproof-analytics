

## Replace Hardcoded Ad Spend with Real Data from Database

### What Changes

Replace the static `monthlyAdSpend: 3500` in the snapshot with a rolling calculation from your `daily_acquisitions` table. You'll also be able to bulk-import your last 60 days of ad metrics via CSV.

### Step 1: CSV Import for Historical Ad Data

Add a CSV import button to the Acquisition tab in Data Entry that accepts your 60-day history file. Expected columns: `date, ad_spend, ad_conv_27, ad_conv_47, ad_conv_333, organic_27, organic_47, organic_333`. Each row upserts into the existing `daily_acquisitions` table (no schema changes needed).

### Step 2: Compute Real Ad Spend in `useLiveMetrics`

Update the `useLiveMetrics` hook to calculate a rolling 30-day ad spend from `daily_acquisitions` data and replace `monthlyAdSpend` with that real number. This means every dashboard metric referencing ad spend will automatically reflect your actual recent spending.

### Step 3: Update AI Data Context

The AI edge function already receives `acquisitionData`. Update `AIInsights.tsx` to also compute and pass a `monthlyAdSpend` override from the acquisition data so the AI strategist sees your real spend instead of $3,500.

### What You Get

- Upload your 60-day CSV once to backfill history
- `monthlyAdSpend` on the dashboard becomes a live rolling 30-day total from real entries
- The AI advisor references your actual ad spend trends instead of a static estimate
- Each new daily entry you log keeps it continuously updated

