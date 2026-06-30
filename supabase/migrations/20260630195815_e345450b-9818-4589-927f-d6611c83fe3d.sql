ALTER TABLE public.churn_events
  ADD COLUMN IF NOT EXISTS recurring_interval TEXT NOT NULL DEFAULT 'month',
  ADD COLUMN IF NOT EXISTS churn_date_estimated BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS churn_events_email_unique
  ON public.churn_events (lower(email))
  WHERE email IS NOT NULL AND email <> '';