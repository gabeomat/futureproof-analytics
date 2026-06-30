
CREATE TABLE public.trial_cohorts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trial_start_date DATE NOT NULL,
  funnel TEXT NOT NULL,
  trial_starts INTEGER NOT NULL DEFAULT 0,
  ad_spend_attributed NUMERIC(10,2) NOT NULL DEFAULT 0,
  day7_paid INTEGER,
  day30_still_paid INTEGER,
  first_payment_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX trial_cohorts_date_funnel_uniq ON public.trial_cohorts (trial_start_date, funnel);
ALTER TABLE public.trial_cohorts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access to trial_cohorts" ON public.trial_cohorts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_trial_cohorts_updated_at BEFORE UPDATE ON public.trial_cohorts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trial_cohorts TO authenticated;
GRANT ALL ON public.trial_cohorts TO service_role;
