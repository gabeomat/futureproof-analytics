CREATE TABLE public.churn_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  price_point NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.churn_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to churn_events" ON public.churn_events
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);