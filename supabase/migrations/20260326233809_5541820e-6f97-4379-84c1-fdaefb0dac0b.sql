-- Create daily_metrics table
CREATE TABLE public.daily_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  mrr NUMERIC NOT NULL DEFAULT 0,
  members INTEGER NOT NULL DEFAULT 0,
  about_page_traffic INTEGER NOT NULL DEFAULT 0,
  discovery_rank INTEGER NOT NULL DEFAULT 0,
  profile_activity INTEGER NOT NULL DEFAULT 0,
  group_activity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create monthly_revenue table
CREATE TABLE public.monthly_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT NOT NULL UNIQUE,
  new_revenue NUMERIC NOT NULL DEFAULT 0,
  revenue_churn NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_revenue ENABLE ROW LEVEL SECURITY;

-- Public read/write for now (single-user app, no auth yet)
CREATE POLICY "Allow all access to daily_metrics" ON public.daily_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to monthly_revenue" ON public.monthly_revenue FOR ALL USING (true) WITH CHECK (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_daily_metrics_updated_at
  BEFORE UPDATE ON public.daily_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_revenue_updated_at
  BEFORE UPDATE ON public.monthly_revenue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();