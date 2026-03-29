
ALTER TABLE public.churn_events
  ADD COLUMN first_name TEXT,
  ADD COLUMN last_name TEXT,
  ADD COLUMN email TEXT,
  ADD COLUMN joined_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN tier TEXT,
  ADD COLUMN ltv NUMERIC NOT NULL DEFAULT 0;

-- Rename price_point to price for clarity (keep old column, add new)
-- Actually price_point already exists and maps to Price, so we keep it.
