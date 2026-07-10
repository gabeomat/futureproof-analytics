
ALTER TABLE public.monthly_revenue
  ADD COLUMN IF NOT EXISTS reactivation_mrr NUMERIC,
  ADD COLUMN IF NOT EXISTS mrr_retention_pct_reported NUMERIC;

UPDATE public.monthly_revenue SET
  starting_mrr = 3723,
  new_mrr = 131,
  expansion_mrr = 10,
  reactivation_mrr = 47,
  contraction_mrr = 0,
  churned_mrr = 768,
  ending_mrr = 3142,
  revenue_churn_pct = 20.6,
  mrr_retention_pct_reported = 77,
  includes_declines = true
WHERE month_start = DATE '2026-06-01';
