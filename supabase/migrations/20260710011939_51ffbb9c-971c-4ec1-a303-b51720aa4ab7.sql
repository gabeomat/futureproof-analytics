
ALTER TABLE public.monthly_revenue
  ADD COLUMN IF NOT EXISTS month_start DATE,
  ADD COLUMN IF NOT EXISTS starting_mrr NUMERIC,
  ADD COLUMN IF NOT EXISTS new_mrr NUMERIC,
  ADD COLUMN IF NOT EXISTS expansion_mrr NUMERIC,
  ADD COLUMN IF NOT EXISTS contraction_mrr NUMERIC,
  ADD COLUMN IF NOT EXISTS churned_mrr NUMERIC,
  ADD COLUMN IF NOT EXISTS ending_mrr NUMERIC,
  ADD COLUMN IF NOT EXISTS revenue_churn_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS includes_declines BOOLEAN NOT NULL DEFAULT true;

UPDATE public.monthly_revenue SET month = 'March 2026' WHERE month = 'March 20226';

UPDATE public.monthly_revenue
SET month_start = to_date(month, 'FMMonth YYYY')
WHERE month_start IS NULL AND month IS NOT NULL;

UPDATE public.monthly_revenue
SET new_mrr = COALESCE(new_mrr, new_revenue),
    churned_mrr = COALESCE(churned_mrr, revenue_churn);

UPDATE public.monthly_revenue SET revenue_churn_pct = 14.3, includes_declines = true WHERE month_start = DATE '2026-03-01';
UPDATE public.monthly_revenue SET revenue_churn_pct = 11.7, includes_declines = true WHERE month_start = DATE '2026-04-01';
UPDATE public.monthly_revenue SET revenue_churn_pct = 10.7, includes_declines = true WHERE month_start = DATE '2026-05-01';

-- Drop legacy columns FIRST, then enforce constraints and insert June.
ALTER TABLE public.monthly_revenue DROP CONSTRAINT IF EXISTS monthly_revenue_month_key;
ALTER TABLE public.monthly_revenue DROP COLUMN IF EXISTS month;
ALTER TABLE public.monthly_revenue DROP COLUMN IF EXISTS new_revenue;
ALTER TABLE public.monthly_revenue DROP COLUMN IF EXISTS revenue_churn;

ALTER TABLE public.monthly_revenue ALTER COLUMN month_start SET NOT NULL;
ALTER TABLE public.monthly_revenue ADD CONSTRAINT monthly_revenue_month_start_key UNIQUE (month_start);

INSERT INTO public.monthly_revenue (month_start, revenue_churn_pct, includes_declines)
VALUES (DATE '2026-06-01', 20.6, true)
ON CONFLICT (month_start) DO UPDATE SET revenue_churn_pct = EXCLUDED.revenue_churn_pct, includes_declines = EXCLUDED.includes_declines;
