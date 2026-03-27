

## Daily Acquisition Tracking (Ads + Organic)

### What Changes

Add a new "Acquisition" tab to the Data Entry page where you log daily ad spend, ad conversions by price tier, and organic sign-ups by price tier. This data feeds into your dashboard metrics so MRR, member counts, and ROI calculations stay accurate.

### Database: New `daily_acquisitions` table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| date | date | Unique per day |
| ad_spend | numeric | Total ad spend that day |
| ad_conv_27 | integer | Ad conversions at $27/mo |
| ad_conv_47 | integer | Ad conversions at $47/mo |
| ad_conv_333 | integer | Ad conversions at $333/yr |
| organic_27 | integer | Organic sign-ups at $27/mo |
| organic_47 | integer | Organic sign-ups at $47/mo |
| organic_333 | integer | Organic sign-ups at $333/yr |
| created_at | timestamptz | Auto-set |

Unique constraint on `date` for upsert support. Open RLS policy (matches existing tables).

### Implementation Steps

1. **Create `daily_acquisitions` table** via migration

2. **Add "Acquisition" tab to `DataEntry.tsx`**
   - Form with date, ad spend, then two grouped sections: "Ad Conversions" ($27, $47, $333) and "Organic" ($27, $47, $333)
   - Table showing historical entries with computed columns: total conversions, daily revenue added, cost per acquisition
   - Summary cards: total ad spend, total conversions, avg CPA, ad vs organic split, ROAS

3. **Wire acquisition data into dashboard metrics**
   - Update the AI edge function's data context to include acquisition data so the AI can analyze ad performance and organic growth trends

### What You Get

- Daily log of exactly where each member came from (ads vs organic) and at what price
- Accurate CPA and ROAS calculations based on real data instead of estimates
- The AI advisor can reference acquisition trends when giving strategic recommendations

